import React, { Suspense, lazy } from 'react'
import Navbar from './Components/Navbar'
import Footer from './Components/Footer'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import Home from './Pages/Home'

const About = lazy(() => import('./Pages/About'))
const ContactUs = lazy(() => import('./Pages/ContactUs'))
const Menu = lazy(() => import('./Pages/Menu'))
const Login = lazy(() => import('./Pages/Login'))
const Signup = lazy(() => import('./Pages/Signup'))
const ResetPassword = lazy(() => import('./Pages/ResetPassword'))
const ProductDetails = lazy(() => import('./Pages/ProductDetails'))
const Cart = lazy(() => import('./Pages/Cart'))
const Wishlist = lazy(() => import('./Pages/Wishlist'))
const Checkout = lazy(() => import('./Pages/Checkout'))
const Account = lazy(() => import('./Pages/Account'))
const NotFound = lazy(() => import('./Pages/NotFound'))

const AdminLogin = lazy(() => import('./admin/Pages/AdminLogin'))
const AdminLayout = lazy(() => import('./admin/components/AdminLayout'))
const Dashboard = lazy(() => import('./admin/Pages/Dashboard'))
const AdminProducts = lazy(() => import('./admin/Pages/Products'))
const AddProduct = lazy(() => import('./admin/Pages/AddProduct'))
const EditProduct = lazy(() => import('./admin/Pages/EditProduct'))
const AdminCategories = lazy(() => import('./admin/Pages/Categories'))
const AdminInventory = lazy(() => import('./admin/Pages/Inventory'))
const AdminCustomers = lazy(() => import('./admin/Pages/Customers'))
const AdminCustomerDetail = lazy(() => import('./admin/Pages/CustomerDetail'))
const AdminReviews = lazy(() => import('./admin/Pages/Reviews'))
const AdminOrders = lazy(() => import('./admin/Pages/Orders'))
const AdminOrderDetail = lazy(() => import('./admin/Pages/OrderDetail'))
const AdminPayments = lazy(() => import('./admin/Pages/Payments'))
const AdminReturns = lazy(() => import('./admin/Pages/Returns'))
const AdminCoupons = lazy(() => import('./admin/Pages/Coupons'))
const AdminPromotions = lazy(() => import('./admin/Pages/Promotions'))
const AdminNotifications = lazy(() => import('./admin/Pages/Notifications'))
const AdminSettings = lazy(() => import('./admin/Pages/Settings'))
const AdminAnalytics = lazy(() => import('./admin/Pages/Analytics'))

import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { ToastProvider } from './context/ToastContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { CatalogProvider } from './context/CatalogContext'

const PageLoader = () => (
  <div className="min-h-[70vh] flex items-center justify-center pt-24">
    <div className="h-9 w-9 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
  </div>
);

const App = () => {
  const location = useLocation();
  const hideHeaderFooter = ['/login', '/signup', '/reset-password'];
  const isAdminRoute = location.pathname.startsWith('/admin');
  const hideChrome = hideHeaderFooter.includes(location.pathname) || isAdminRoute;

  return (
    <AuthProvider>
      <ToastProvider>
        <CatalogProvider>
          <WishlistProvider>
            <CartProvider>
              <AdminAuthProvider>
              <div className='dark:bg-ink-900 dark:text-white min-h-screen bg-cream-50 flex flex-col'>
                {!hideChrome && <Navbar />}
                <main className="flex-1">
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contactus" element={<ContactUs />} />
                      <Route path="/menu" element={<Menu />} />
                      <Route path="/product/:id" element={<ProductDetails />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/reset-password" element={<ResetPassword />} />

                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="products/new" element={<AddProduct />} />
                        <Route path="products/:id/edit" element={<EditProduct />} />
                        <Route path="categories" element={<AdminCategories />} />
                        <Route path="inventory" element={<AdminInventory />} />
                        <Route path="customers" element={<AdminCustomers />} />
                        <Route path="customers/:id" element={<AdminCustomerDetail />} />
                        <Route path="reviews" element={<AdminReviews />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="orders/:id" element={<AdminOrderDetail />} />
                        <Route path="payments" element={<AdminPayments />} />
                        <Route path="returns" element={<AdminReturns />} />
                        <Route path="coupons" element={<AdminCoupons />} />
                        <Route path="promotions" element={<AdminPromotions />} />
                        <Route path="notifications" element={<AdminNotifications />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="analytics" element={<AdminAnalytics />} />
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </main>
                {!hideChrome && <Footer />}
              </div>
              </AdminAuthProvider>
            </CartProvider>
          </WishlistProvider>
        </CatalogProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

const AppWithRouter = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

export default AppWithRouter
