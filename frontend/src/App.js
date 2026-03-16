import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ThemeProvider } from "./context/ThemeContext";

// Layout Components
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";

// Pages
import { HomePage } from "./pages/HomePage";
import { ShopPage } from "./pages/ShopPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderSuccessPage } from "./pages/OrderSuccessPage";
import { LoginPage } from "./pages/LoginPage";
import { UserDashboard } from "./pages/UserDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { WishlistPage } from "./pages/WishlistPage";

// Layout wrapper for pages with navbar/footer
const MainLayout = ({ children }) => (
  <>
    <Navbar />
    <main className="min-h-screen">{children}</main>
    <Footer />
  </>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <div className="App dark-mode-transition">
                <Routes>
                  {/* Admin routes - no navbar/footer */}
                  <Route path="/admin/*" element={<AdminDashboard />} />

                  {/* Main routes with navbar/footer */}
                  <Route
                    path="/"
                    element={
                      <MainLayout>
                        <HomePage />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/shop"
                    element={
                      <MainLayout>
                        <ShopPage />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/product/:id"
                    element={
                      <MainLayout>
                        <ProductDetailPage />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/cart"
                    element={
                      <MainLayout>
                        <CartPage />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <MainLayout>
                        <CheckoutPage />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/order-success/:orderId"
                    element={
                      <MainLayout>
                        <OrderSuccessPage />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/login"
                    element={
                      <MainLayout>
                        <LoginPage />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/account/*"
                    element={
                      <MainLayout>
                        <UserDashboard />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/wishlist"
                    element={
                      <MainLayout>
                        <WishlistPage />
                      </MainLayout>
                    }
                  />
                </Routes>
                <Toaster position="bottom-right" richColors />
              </div>
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
