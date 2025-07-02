import React from 'react'
import Navbar from './Components/Navbar'
import Header from './Components/Header'
import Footer from './Components/Footer'
import Banner from './Components/Banner'
import Footer1 from './Components/Footer1'
import SandwichCard from './Components/SandwichCard'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import Home from './Pages/Home'
import About from './Pages/About'
import ContactUs from './Pages/ContactUs'
import Menu from './Pages/Menu'
import Login from './Pages/Login'
import ContactPage from './Pages/ContactPage'
import AboutPage from './Pages/AboutPage'
import Ex from './Pages/Ex'
import Signup from './Pages/Signup'
import Sandwich from './sandwich/Sandwich'






const App = () => {


  const location = useLocation();
  const hideHeaderFooter = ['/login', '/signup'];
  return (
    // <>
    //   {/* <div className="bg-gray-900 min-h-screen text-white">
    //     <Navbar/>
    //   </div> */}
    //   {/* <Navbar /> */}
    //   <Header/>
    //   <Banner/>
    //   <SandwichCard/>
    //   {/* <Footer/> */}
    //   <Footer1/>
    // </>

    <>

      <div className='dark:bg-slate-900 dark:text-white'>

        {/* <Header/> */}
        {!hideHeaderFooter.includes(location.pathname) && <Header />}
        <Routes>
          {/* <Route path="/" element={<Home/>}/> 
        <Route path="/about" element={<AboutPage/>}/> 
        <Route path="/contactus" element={<ContactPage/>}/> 
        <Route path="/menu" element={<Menu/>}/>  */}

          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contactus" element={<ContactUs />} />
          <Route path="/menu" element={<Menu />} />
          {/* <Route path="/menu" element={<Sandwich/>}/> */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* <Route path="/EX" element={<Ex/>}/> */}
        </Routes>
        {/* <Footer1/> */}
        {/* <Footer/> */}
        {!hideHeaderFooter.includes(location.pathname) && <Footer />}
        {/* <Home/> */}
      </div>

    </>
  )
}

export default App