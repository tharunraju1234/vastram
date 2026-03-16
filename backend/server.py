from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'vastram-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="VASTRAM API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str = "user"
    created_at: str

class AddressCreate(BaseModel):
    name: str
    phone: str
    street: str
    city: str
    state: str
    pincode: str
    is_default: bool = False

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    discount_price: Optional[float] = None
    category: str
    subcategory: str
    sizes: List[str] = []
    colors: List[str] = []
    images: List[str] = []
    stock: int = 100
    featured: bool = False
    is_new: bool = False
    is_bestseller: bool = False
    fabric: Optional[str] = None
    care_instructions: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    description: str
    price: float
    discount_price: Optional[float] = None
    category: str
    subcategory: str
    sizes: List[str] = []
    colors: List[str] = []
    images: List[str] = []
    stock: int
    featured: bool
    is_new: bool
    is_bestseller: bool
    rating: float = 0
    reviews_count: int = 0
    fabric: Optional[str] = None
    care_instructions: Optional[str] = None
    created_at: str

class CartItem(BaseModel):
    product_id: str
    quantity: int
    size: str
    color: str

class CartItemResponse(BaseModel):
    product_id: str
    name: str
    price: float
    discount_price: Optional[float] = None
    image: str
    quantity: int
    size: str
    color: str

class OrderCreate(BaseModel):
    items: List[CartItem]
    shipping_address: AddressCreate
    payment_method: str = "cod"

class OrderResponse(BaseModel):
    id: str
    user_id: str
    items: List[dict]
    shipping_address: dict
    payment_method: str
    subtotal: float
    shipping: float
    discount: float
    total: float
    status: str
    created_at: str

class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str

class CouponCreate(BaseModel):
    code: str
    type: str  # percentage or flat
    value: float
    min_order: float = 0
    expires_at: Optional[str] = None
    is_active: bool = True

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=dict)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "phone": user.phone,
        "role": "user",
        "addresses": [],
        "wishlist": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_doc["id"], user_doc["role"])
    return {
        "token": token,
        "user": {
            "id": user_doc["id"],
            "name": user_doc["name"],
            "email": user_doc["email"],
            "role": user_doc["role"]
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }

@api_router.get("/auth/me", response_model=dict)
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone"),
        "role": user["role"],
        "addresses": user.get("addresses", []),
        "wishlist": user.get("wishlist", [])
    }

@api_router.put("/auth/profile", response_model=dict)
async def update_profile(data: dict, user: dict = Depends(get_current_user)):
    update_fields = {}
    if "name" in data:
        update_fields["name"] = data["name"]
    if "phone" in data:
        update_fields["phone"] = data["phone"]
    
    if update_fields:
        await db.users.update_one({"id": user["id"]}, {"$set": update_fields})
    
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return updated

# ==================== ADDRESS ROUTES ====================

@api_router.post("/addresses", response_model=dict)
async def add_address(address: AddressCreate, user: dict = Depends(get_current_user)):
    address_doc = {
        "id": str(uuid.uuid4()),
        **address.model_dump()
    }
    
    if address.is_default:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"addresses.$[].is_default": False}}
        )
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$push": {"addresses": address_doc}}
    )
    return address_doc

@api_router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": user["id"]},
        {"$pull": {"addresses": {"id": address_id}}}
    )
    return {"message": "Address deleted"}

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products", response_model=dict)
async def get_products(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sizes: Optional[str] = None,
    colors: Optional[str] = None,
    sort: Optional[str] = "newest",
    featured: Optional[bool] = None,
    is_new: Optional[bool] = None,
    is_bestseller: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 12
):
    query = {}
    
    if category:
        query["category"] = category.lower()
    if subcategory:
        query["subcategory"] = subcategory.lower()
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query["price"] = {**query.get("price", {}), "$lte": max_price}
    if sizes:
        query["sizes"] = {"$in": sizes.split(",")}
    if colors:
        query["colors"] = {"$in": colors.split(",")}
    if featured is not None:
        query["featured"] = featured
    if is_new is not None:
        query["is_new"] = is_new
    if is_bestseller is not None:
        query["is_bestseller"] = is_bestseller
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    sort_options = {
        "newest": [("created_at", -1)],
        "price_low": [("price", 1)],
        "price_high": [("price", -1)],
        "popularity": [("reviews_count", -1)]
    }
    sort_by = sort_options.get(sort, [("created_at", -1)])
    
    skip = (page - 1) * limit
    total = await db.products.count_documents(query)
    products = await db.products.find(query, {"_id": 0}).sort(sort_by).skip(skip).limit(limit).to_list(limit)
    
    return {
        "products": products,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/products/{product_id}", response_model=dict)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(100)
    related = await db.products.find(
        {"category": product["category"], "id": {"$ne": product_id}},
        {"_id": 0}
    ).limit(4).to_list(4)
    
    return {
        "product": product,
        "reviews": reviews,
        "related": related
    }

@api_router.post("/products", response_model=dict)
async def create_product(product: ProductCreate, admin: dict = Depends(get_admin_user)):
    product_doc = {
        "id": str(uuid.uuid4()),
        **product.model_dump(),
        "category": product.category.lower(),
        "subcategory": product.subcategory.lower(),
        "rating": 0,
        "reviews_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product_doc)
    if "_id" in product_doc:
        del product_doc["_id"]
    return product_doc

@api_router.put("/products/{product_id}", response_model=dict)
async def update_product(product_id: str, data: dict, admin: dict = Depends(get_admin_user)):
    if "category" in data:
        data["category"] = data["category"].lower()
    if "subcategory" in data:
        data["subcategory"] = data["subcategory"].lower()
    
    await db.products.update_one({"id": product_id}, {"$set": data})
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_admin_user)):
    await db.products.delete_one({"id": product_id})
    return {"message": "Product deleted"}

# ==================== CATEGORY ROUTES ====================

@api_router.get("/categories", response_model=List[dict])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.post("/categories", response_model=dict)
async def create_category(data: dict, admin: dict = Depends(get_admin_user)):
    category_doc = {
        "id": str(uuid.uuid4()),
        "name": data["name"],
        "slug": data["name"].lower().replace(" ", "-"),
        "subcategories": data.get("subcategories", []),
        "image": data.get("image", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(category_doc)
    return {"id": category_doc["id"], "name": category_doc["name"], "slug": category_doc["slug"], "subcategories": category_doc["subcategories"], "image": category_doc["image"]}

# ==================== CART ROUTES ====================

@api_router.get("/cart", response_model=dict)
async def get_cart(user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart:
        return {"items": [], "total": 0}
    
    items = []
    total = 0
    for item in cart.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            price = product.get("discount_price") or product["price"]
            items.append({
                "product_id": product["id"],
                "name": product["name"],
                "price": product["price"],
                "discount_price": product.get("discount_price"),
                "image": product["images"][0] if product["images"] else "",
                "quantity": item["quantity"],
                "size": item["size"],
                "color": item["color"]
            })
            total += price * item["quantity"]
    
    return {"items": items, "total": total}

@api_router.post("/cart", response_model=dict)
async def add_to_cart(item: CartItem, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]})
    
    if not cart:
        cart = {"user_id": user["id"], "items": []}
        await db.carts.insert_one(cart)
    
    existing_idx = None
    for idx, existing in enumerate(cart.get("items", [])):
        if (existing["product_id"] == item.product_id and 
            existing["size"] == item.size and 
            existing["color"] == item.color):
            existing_idx = idx
            break
    
    if existing_idx is not None:
        await db.carts.update_one(
            {"user_id": user["id"]},
            {"$inc": {f"items.{existing_idx}.quantity": item.quantity}}
        )
    else:
        await db.carts.update_one(
            {"user_id": user["id"]},
            {"$push": {"items": item.model_dump()}}
        )
    
    return await get_cart(user)

@api_router.put("/cart", response_model=dict)
async def update_cart_item(item: CartItem, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]})
    if cart:
        for idx, existing in enumerate(cart.get("items", [])):
            if (existing["product_id"] == item.product_id and 
                existing["size"] == item.size and 
                existing["color"] == item.color):
                if item.quantity <= 0:
                    await db.carts.update_one(
                        {"user_id": user["id"]},
                        {"$pull": {"items": {"product_id": item.product_id, "size": item.size, "color": item.color}}}
                    )
                else:
                    await db.carts.update_one(
                        {"user_id": user["id"]},
                        {"$set": {f"items.{idx}.quantity": item.quantity}}
                    )
                break
    
    return await get_cart(user)

@api_router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, size: str, color: str, user: dict = Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": user["id"]},
        {"$pull": {"items": {"product_id": product_id, "size": size, "color": color}}}
    )
    return await get_cart(user)

@api_router.delete("/cart")
async def clear_cart(user: dict = Depends(get_current_user)):
    await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": []}})
    return {"items": [], "total": 0}

# ==================== WISHLIST ROUTES ====================

@api_router.get("/wishlist", response_model=List[dict])
async def get_wishlist(user: dict = Depends(get_current_user)):
    wishlist_ids = user.get("wishlist", [])
    products = await db.products.find({"id": {"$in": wishlist_ids}}, {"_id": 0}).to_list(100)
    return products

@api_router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": user["id"]},
        {"$addToSet": {"wishlist": product_id}}
    )
    return {"message": "Added to wishlist"}

@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": user["id"]},
        {"$pull": {"wishlist": product_id}}
    )
    return {"message": "Removed from wishlist"}

# ==================== ORDER ROUTES ====================

@api_router.post("/orders", response_model=dict)
async def create_order(order: OrderCreate, user: dict = Depends(get_current_user)):
    items_with_details = []
    subtotal = 0
    
    for item in order.items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        price = product.get("discount_price") or product["price"]
        items_with_details.append({
            "product_id": product["id"],
            "name": product["name"],
            "price": price,
            "image": product["images"][0] if product["images"] else "",
            "quantity": item.quantity,
            "size": item.size,
            "color": item.color
        })
        subtotal += price * item.quantity
    
    shipping = 0 if subtotal >= 999 else 99
    discount = 0
    total = subtotal + shipping - discount
    
    order_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "items": items_with_details,
        "shipping_address": order.shipping_address.model_dump(),
        "payment_method": order.payment_method,
        "subtotal": subtotal,
        "shipping": shipping,
        "discount": discount,
        "total": total,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": []}})
    
    return {
        "id": order_doc["id"],
        "user_id": order_doc["user_id"],
        "items": order_doc["items"],
        "shipping_address": order_doc["shipping_address"],
        "payment_method": order_doc["payment_method"],
        "subtotal": order_doc["subtotal"],
        "shipping": order_doc["shipping"],
        "discount": order_doc["discount"],
        "total": order_doc["total"],
        "status": order_doc["status"],
        "created_at": order_doc["created_at"]
    }

@api_router.get("/orders", response_model=List[dict])
async def get_orders(user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/orders/{order_id}", response_model=dict)
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# ==================== REVIEW ROUTES ====================

@api_router.post("/reviews", response_model=dict)
async def create_review(review: ReviewCreate, user: dict = Depends(get_current_user)):
    review_doc = {
        "id": str(uuid.uuid4()),
        "product_id": review.product_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "rating": review.rating,
        "comment": review.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review_doc)
    
    reviews = await db.reviews.find({"product_id": review.product_id}).to_list(1000)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    await db.products.update_one(
        {"id": review.product_id},
        {"$set": {"rating": round(avg_rating, 1), "reviews_count": len(reviews)}}
    )
    
    return {"id": review_doc["id"], "product_id": review_doc["product_id"], "user_id": review_doc["user_id"], "user_name": review_doc["user_name"], "rating": review_doc["rating"], "comment": review_doc["comment"], "created_at": review_doc["created_at"]}

# ==================== COUPON ROUTES ====================

@api_router.post("/coupons/validate", response_model=dict)
async def validate_coupon(data: dict, user: dict = Depends(get_current_user)):
    code = data.get("code", "").upper()
    coupon = await db.coupons.find_one({"code": code, "is_active": True}, {"_id": 0})
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    if coupon.get("expires_at"):
        if datetime.fromisoformat(coupon["expires_at"]) < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Coupon expired")
    
    return coupon

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/dashboard", response_model=dict)
async def admin_dashboard(admin: dict = Depends(get_admin_user)):
    total_orders = await db.orders.count_documents({})
    total_customers = await db.users.count_documents({"role": "user"})
    total_products = await db.products.count_documents({})
    
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    total_revenue = sum(o.get("total", 0) for o in orders)
    
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    
    pending_orders = await db.orders.count_documents({"status": "pending"})
    shipped_orders = await db.orders.count_documents({"status": "shipped"})
    delivered_orders = await db.orders.count_documents({"status": "delivered"})
    
    return {
        "total_orders": total_orders,
        "total_customers": total_customers,
        "total_products": total_products,
        "total_revenue": total_revenue,
        "recent_orders": recent_orders,
        "order_stats": {
            "pending": pending_orders,
            "shipped": shipped_orders,
            "delivered": delivered_orders
        }
    }

@api_router.get("/admin/orders", response_model=List[dict])
async def admin_get_orders(
    status: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    query = {}
    if status:
        query["status"] = status
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.put("/admin/orders/{order_id}", response_model=dict)
async def admin_update_order(order_id: str, data: dict, admin: dict = Depends(get_admin_user)):
    await db.orders.update_one({"id": order_id}, {"$set": data})
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return order

@api_router.get("/admin/customers", response_model=List[dict])
async def admin_get_customers(admin: dict = Depends(get_admin_user)):
    customers = await db.users.find({"role": "user"}, {"_id": 0, "password": 0}).to_list(1000)
    return customers

@api_router.put("/admin/customers/{user_id}", response_model=dict)
async def admin_update_customer(user_id: str, data: dict, admin: dict = Depends(get_admin_user)):
    await db.users.update_one({"id": user_id}, {"$set": data})
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return user

@api_router.get("/admin/coupons", response_model=List[dict])
async def admin_get_coupons(admin: dict = Depends(get_admin_user)):
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(100)
    return coupons

@api_router.post("/admin/coupons", response_model=dict)
async def admin_create_coupon(coupon: CouponCreate, admin: dict = Depends(get_admin_user)):
    coupon_doc = {
        "id": str(uuid.uuid4()),
        **coupon.model_dump(),
        "code": coupon.code.upper(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.coupons.insert_one(coupon_doc)
    return {"id": coupon_doc["id"], "code": coupon_doc["code"], "type": coupon_doc["type"], "value": coupon_doc["value"], "min_order": coupon_doc["min_order"], "is_active": coupon_doc["is_active"]}

@api_router.delete("/admin/coupons/{coupon_id}")
async def admin_delete_coupon(coupon_id: str, admin: dict = Depends(get_admin_user)):
    await db.coupons.delete_one({"id": coupon_id})
    return {"message": "Coupon deleted"}

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    # Check if data already exists
    existing = await db.products.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded", "products": existing}
    
    # Create admin user
    admin_exists = await db.users.find_one({"email": "admin@vastram.com"})
    if not admin_exists:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "name": "Admin",
            "email": "admin@vastram.com",
            "password": hash_password("admin123"),
            "role": "admin",
            "addresses": [],
            "wishlist": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
    
    # Categories
    categories = [
        {"id": str(uuid.uuid4()), "name": "Men", "slug": "men", "subcategories": ["shirts", "t-shirts", "jeans", "jackets", "ethnic wear"], "image": "https://images.unsplash.com/photo-1764698072685-f01c10bd2dca?w=800"},
        {"id": str(uuid.uuid4()), "name": "Women", "slug": "women", "subcategories": ["dresses", "tops", "sarees", "jeans", "jackets"], "image": "https://images.unsplash.com/photo-1768460608433-d3af5148832c?w=800"},
        {"id": str(uuid.uuid4()), "name": "Kids", "slug": "kids", "subcategories": ["boys wear", "girls wear", "winter wear"], "image": "https://images.unsplash.com/photo-1759313560255-0458c8f4e615?w=800"}
    ]
    await db.categories.insert_many(categories)
    
    # Products
    products = [
        # Men's Products
        {"id": str(uuid.uuid4()), "name": "Classic Linen Shirt", "description": "Premium quality linen shirt perfect for summer. Breathable fabric with a relaxed fit.", "price": 2499, "discount_price": 1999, "category": "men", "subcategory": "shirts", "sizes": ["S", "M", "L", "XL"], "colors": ["White", "Blue", "Beige"], "images": ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800", "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800"], "stock": 50, "featured": True, "is_new": True, "is_bestseller": False, "fabric": "100% Linen", "care_instructions": "Machine wash cold", "rating": 4.5, "reviews_count": 24, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Urban Denim Jacket", "description": "Classic denim jacket with modern styling. Perfect layering piece for any season.", "price": 3999, "discount_price": 3499, "category": "men", "subcategory": "jackets", "sizes": ["S", "M", "L", "XL"], "colors": ["Blue", "Black"], "images": ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800", "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800"], "stock": 30, "featured": True, "is_new": False, "is_bestseller": True, "fabric": "100% Cotton Denim", "care_instructions": "Machine wash cold", "rating": 4.8, "reviews_count": 56, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Essential Cotton Tee", "description": "Soft cotton t-shirt with a comfortable fit. Everyday essential for your wardrobe.", "price": 999, "discount_price": None, "category": "men", "subcategory": "t-shirts", "sizes": ["S", "M", "L", "XL", "XXL"], "colors": ["White", "Black", "Navy", "Grey"], "images": ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800", "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800"], "stock": 100, "featured": False, "is_new": False, "is_bestseller": True, "fabric": "100% Cotton", "care_instructions": "Machine wash warm", "rating": 4.3, "reviews_count": 89, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Slim Fit Chinos", "description": "Versatile slim fit chinos that transition from work to weekend effortlessly.", "price": 1999, "discount_price": 1599, "category": "men", "subcategory": "jeans", "sizes": ["28", "30", "32", "34", "36"], "colors": ["Khaki", "Navy", "Olive"], "images": ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800"], "stock": 45, "featured": False, "is_new": True, "is_bestseller": False, "fabric": "98% Cotton, 2% Elastane", "care_instructions": "Machine wash cold", "rating": 4.2, "reviews_count": 34, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Kurta Pajama Set", "description": "Traditional kurta pajama set with contemporary styling. Perfect for festive occasions.", "price": 2999, "discount_price": None, "category": "men", "subcategory": "ethnic wear", "sizes": ["S", "M", "L", "XL"], "colors": ["White", "Cream", "Light Blue"], "images": ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800"], "stock": 25, "featured": True, "is_new": False, "is_bestseller": False, "fabric": "Cotton Silk Blend", "care_instructions": "Dry clean recommended", "rating": 4.6, "reviews_count": 18, "created_at": datetime.now(timezone.utc).isoformat()},
        
        # Women's Products
        {"id": str(uuid.uuid4()), "name": "Floral Maxi Dress", "description": "Elegant floral print maxi dress with flowing silhouette. Perfect for summer occasions.", "price": 3499, "discount_price": 2799, "category": "women", "subcategory": "dresses", "sizes": ["XS", "S", "M", "L"], "colors": ["Floral Blue", "Floral Pink"], "images": ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800", "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800"], "stock": 35, "featured": True, "is_new": True, "is_bestseller": True, "fabric": "Viscose Rayon", "care_instructions": "Hand wash cold", "rating": 4.7, "reviews_count": 67, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Premium Cotton Saree", "description": "Handwoven cotton saree with traditional motifs. Elegant and comfortable for all-day wear.", "price": 4999, "discount_price": 3999, "category": "women", "subcategory": "sarees", "sizes": ["Free Size"], "colors": ["Red", "Blue", "Green"], "images": ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"], "stock": 20, "featured": True, "is_new": False, "is_bestseller": True, "fabric": "Handwoven Cotton", "care_instructions": "Dry clean only", "rating": 4.9, "reviews_count": 42, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Silk Blend Top", "description": "Luxurious silk blend top with subtle sheen. Perfect for office or evening wear.", "price": 1799, "discount_price": None, "category": "women", "subcategory": "tops", "sizes": ["XS", "S", "M", "L", "XL"], "colors": ["Ivory", "Black", "Burgundy"], "images": ["https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800"], "stock": 60, "featured": False, "is_new": True, "is_bestseller": False, "fabric": "Silk Blend", "care_instructions": "Hand wash or dry clean", "rating": 4.4, "reviews_count": 28, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "High Waist Jeans", "description": "Flattering high waist jeans with stretch comfort. Classic style meets modern fit.", "price": 2299, "discount_price": 1899, "category": "women", "subcategory": "jeans", "sizes": ["26", "28", "30", "32", "34"], "colors": ["Light Blue", "Dark Blue", "Black"], "images": ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800"], "stock": 55, "featured": False, "is_new": False, "is_bestseller": True, "fabric": "Cotton Denim with Stretch", "care_instructions": "Machine wash cold", "rating": 4.5, "reviews_count": 93, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Leather Biker Jacket", "description": "Genuine leather biker jacket with classic styling. Timeless piece for your wardrobe.", "price": 8999, "discount_price": 7499, "category": "women", "subcategory": "jackets", "sizes": ["XS", "S", "M", "L"], "colors": ["Black", "Brown"], "images": ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800"], "stock": 15, "featured": True, "is_new": False, "is_bestseller": False, "fabric": "Genuine Leather", "care_instructions": "Professional leather care", "rating": 4.8, "reviews_count": 21, "created_at": datetime.now(timezone.utc).isoformat()},
        
        # Kids' Products
        {"id": str(uuid.uuid4()), "name": "Kids Winter Hoodie", "description": "Warm and cozy hoodie for kids. Fun colors and comfortable fit for active play.", "price": 1299, "discount_price": 999, "category": "kids", "subcategory": "winter wear", "sizes": ["4-5Y", "6-7Y", "8-9Y", "10-11Y"], "colors": ["Red", "Blue", "Yellow", "Green"], "images": ["https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800"], "stock": 80, "featured": True, "is_new": True, "is_bestseller": True, "fabric": "Fleece", "care_instructions": "Machine wash warm", "rating": 4.6, "reviews_count": 45, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Boys Casual Shirt", "description": "Smart casual shirt for boys. Perfect for school or special occasions.", "price": 899, "discount_price": None, "category": "kids", "subcategory": "boys wear", "sizes": ["4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"], "colors": ["White", "Blue", "Checks"], "images": ["https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800"], "stock": 70, "featured": False, "is_new": False, "is_bestseller": False, "fabric": "Cotton", "care_instructions": "Machine wash warm", "rating": 4.3, "reviews_count": 32, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Girls Party Dress", "description": "Beautiful party dress for girls. Sparkle and shine at any celebration.", "price": 1999, "discount_price": 1599, "category": "kids", "subcategory": "girls wear", "sizes": ["4-5Y", "6-7Y", "8-9Y", "10-11Y"], "colors": ["Pink", "Purple", "Gold"], "images": ["https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800"], "stock": 40, "featured": True, "is_new": True, "is_bestseller": False, "fabric": "Polyester with Tulle", "care_instructions": "Hand wash cold", "rating": 4.7, "reviews_count": 28, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Kids Denim Jacket", "description": "Trendy denim jacket for kids. Cool style for fashion-forward little ones.", "price": 1499, "discount_price": 1199, "category": "kids", "subcategory": "winter wear", "sizes": ["4-5Y", "6-7Y", "8-9Y", "10-11Y"], "colors": ["Blue", "Light Blue"], "images": ["https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800"], "stock": 35, "featured": False, "is_new": False, "is_bestseller": True, "fabric": "Cotton Denim", "care_instructions": "Machine wash cold", "rating": 4.4, "reviews_count": 19, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    await db.products.insert_many(products)
    
    # Coupons
    coupons = [
        {"id": str(uuid.uuid4()), "code": "WELCOME10", "type": "percentage", "value": 10, "min_order": 500, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "FLAT200", "type": "flat", "value": 200, "min_order": 1500, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.coupons.insert_many(coupons)
    
    return {"message": "Data seeded successfully", "products": len(products), "categories": len(categories)}

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "VASTRAM API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
