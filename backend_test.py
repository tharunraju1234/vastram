#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class VastramAPITester:
    def __init__(self, base_url="https://modern-boutique-12.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            if not success:
                details += f" (expected {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"

            self.log_test(name, success, details if not success else "")
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_seed_data(self):
        """Test seeding initial data"""
        print("\n🌱 Testing Data Seeding...")
        result = self.run_test("Seed Data", "POST", "seed", 200)
        return result is not None

    def test_auth_flow(self):
        """Test authentication flow"""
        print("\n🔐 Testing Authentication...")
        
        # Test user registration
        test_user = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"test{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "testpass123",
            "phone": "9876543210"
        }
        
        register_result = self.run_test("User Registration", "POST", "auth/register", 200, test_user)
        if register_result and 'token' in register_result:
            self.token = register_result['token']
            self.user_id = register_result['user']['id']
        
        # Test admin login
        admin_creds = {
            "email": "admin@vastram.com",
            "password": "admin123"
        }
        
        admin_result = self.run_test("Admin Login", "POST", "auth/login", 200, admin_creds)
        if admin_result and 'token' in admin_result:
            self.admin_token = admin_result['token']
        
        # Test user profile
        if self.token:
            self.run_test("Get User Profile", "GET", "auth/me", 200, 
                         headers={'Authorization': f'Bearer {self.token}'})
        
        return self.token is not None and self.admin_token is not None

    def test_categories(self):
        """Test category endpoints"""
        print("\n📂 Testing Categories...")
        
        # Get categories
        self.run_test("Get Categories", "GET", "categories", 200)
        
        # Admin create category
        if self.admin_token:
            new_category = {
                "name": "Test Category",
                "subcategories": ["test-sub1", "test-sub2"],
                "image": "https://example.com/test.jpg"
            }
            self.run_test("Create Category (Admin)", "POST", "categories", 200, 
                         new_category, {'Authorization': f'Bearer {self.admin_token}'})

    def test_products(self):
        """Test product endpoints"""
        print("\n🛍️ Testing Products...")
        
        # Get all products
        products_result = self.run_test("Get All Products", "GET", "products", 200)
        
        # Get products with filters
        self.run_test("Get Men's Products", "GET", "products?category=men", 200)
        self.run_test("Get Featured Products", "GET", "products?featured=true", 200)
        self.run_test("Get New Arrivals", "GET", "products?is_new=true", 200)
        self.run_test("Get Bestsellers", "GET", "products?is_bestseller=true", 200)
        self.run_test("Search Products", "GET", "products?search=shirt", 200)
        
        # Get specific product
        if products_result and 'products' in products_result and products_result['products']:
            product_id = products_result['products'][0]['id']
            self.run_test("Get Product Details", "GET", f"products/{product_id}", 200)
            return product_id
        
        return None

    def test_cart_flow(self, product_id):
        """Test cart functionality"""
        print("\n🛒 Testing Cart...")
        
        if not self.token or not product_id:
            print("⚠️ Skipping cart tests - no auth token or product ID")
            return
        
        headers = {'Authorization': f'Bearer {self.token}'}
        
        # Get empty cart
        self.run_test("Get Empty Cart", "GET", "cart", 200, headers=headers)
        
        # Add to cart
        cart_item = {
            "product_id": product_id,
            "quantity": 2,
            "size": "M",
            "color": "Blue"
        }
        self.run_test("Add to Cart", "POST", "cart", 200, cart_item, headers)
        
        # Get cart with items
        cart_result = self.run_test("Get Cart with Items", "GET", "cart", 200, headers=headers)
        
        # Update cart item
        update_item = {
            "product_id": product_id,
            "quantity": 3,
            "size": "M",
            "color": "Blue"
        }
        self.run_test("Update Cart Item", "PUT", "cart", 200, update_item, headers)
        
        # Remove from cart
        self.run_test("Remove from Cart", "DELETE", f"cart/{product_id}?size=M&color=Blue", 200, headers=headers)

    def test_wishlist(self, product_id):
        """Test wishlist functionality"""
        print("\n❤️ Testing Wishlist...")
        
        if not self.token or not product_id:
            print("⚠️ Skipping wishlist tests - no auth token or product ID")
            return
        
        headers = {'Authorization': f'Bearer {self.token}'}
        
        # Get empty wishlist
        self.run_test("Get Empty Wishlist", "GET", "wishlist", 200, headers=headers)
        
        # Add to wishlist
        self.run_test("Add to Wishlist", "POST", f"wishlist/{product_id}", 200, headers=headers)
        
        # Get wishlist with items
        self.run_test("Get Wishlist with Items", "GET", "wishlist", 200, headers=headers)
        
        # Remove from wishlist
        self.run_test("Remove from Wishlist", "DELETE", f"wishlist/{product_id}", 200, headers=headers)

    def test_orders(self, product_id):
        """Test order functionality"""
        print("\n📦 Testing Orders...")
        
        if not self.token or not product_id:
            print("⚠️ Skipping order tests - no auth token or product ID")
            return
        
        headers = {'Authorization': f'Bearer {self.token}'}
        
        # Add item to cart first
        cart_item = {
            "product_id": product_id,
            "quantity": 1,
            "size": "L",
            "color": "Black"
        }
        self.run_test("Add Item for Order", "POST", "cart", 200, cart_item, headers)
        
        # Create order
        order_data = {
            "items": [cart_item],
            "shipping_address": {
                "name": "Test User",
                "phone": "9876543210",
                "street": "123 Test Street",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001",
                "is_default": False
            },
            "payment_method": "cod"
        }
        
        order_result = self.run_test("Create Order", "POST", "orders", 200, order_data, headers)
        
        # Get user orders
        self.run_test("Get User Orders", "GET", "orders", 200, headers=headers)
        
        # Get specific order
        if order_result and 'id' in order_result:
            order_id = order_result['id']
            self.run_test("Get Order Details", "GET", f"orders/{order_id}", 200, headers=headers)
            return order_id
        
        return None

    def test_admin_endpoints(self, order_id=None):
        """Test admin-only endpoints"""
        print("\n👑 Testing Admin Endpoints...")
        
        if not self.admin_token:
            print("⚠️ Skipping admin tests - no admin token")
            return
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Admin dashboard
        self.run_test("Admin Dashboard", "GET", "admin/dashboard", 200, headers=headers)
        
        # Admin orders
        self.run_test("Admin Get Orders", "GET", "admin/orders", 200, headers=headers)
        
        # Admin customers
        self.run_test("Admin Get Customers", "GET", "admin/customers", 200, headers=headers)
        
        # Admin coupons
        self.run_test("Admin Get Coupons", "GET", "admin/coupons", 200, headers=headers)
        
        # Create coupon
        coupon_data = {
            "code": f"TEST{datetime.now().strftime('%H%M%S')}",
            "type": "percentage",
            "value": 10,
            "min_order": 500,
            "is_active": True
        }
        coupon_result = self.run_test("Create Coupon", "POST", "admin/coupons", 200, coupon_data, headers)
        
        # Update order status
        if order_id:
            self.run_test("Update Order Status", "PUT", f"admin/orders/{order_id}", 200, 
                         {"status": "shipped"}, headers)

    def test_coupon_validation(self):
        """Test coupon validation"""
        print("\n🎫 Testing Coupon Validation...")
        
        if not self.token:
            print("⚠️ Skipping coupon tests - no user token")
            return
        
        headers = {'Authorization': f'Bearer {self.token}'}
        
        # Test existing coupon
        self.run_test("Validate WELCOME10 Coupon", "POST", "coupons/validate", 200, 
                     {"code": "WELCOME10"}, headers)
        
        # Test invalid coupon
        self.run_test("Invalid Coupon", "POST", "coupons/validate", 404, 
                     {"code": "INVALID123"}, headers)

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting VASTRAM API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Seed data first
        if not self.test_seed_data():
            print("❌ Failed to seed data, continuing with existing data...")
        
        # Test authentication
        if not self.test_auth_flow():
            print("❌ Authentication failed, some tests will be skipped")
        
        # Test categories
        self.test_categories()
        
        # Test products
        product_id = self.test_products()
        
        # Test cart flow
        self.test_cart_flow(product_id)
        
        # Test wishlist
        self.test_wishlist(product_id)
        
        # Test orders
        order_id = self.test_orders(product_id)
        
        # Test admin endpoints
        self.test_admin_endpoints(order_id)
        
        # Test coupon validation
        self.test_coupon_validation()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = VastramAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())