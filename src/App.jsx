import React from 'react'
import Navbar from './Components/Navbar'
import Header from './Components/Header'
import Footer from './Components/Footer'
import Banner from './Components/Banner'
import Footer1 from './Components/Footer1'
import SandwichCard from './Components/SandwichCard'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './Pages/Home'
import About from './Pages/About'
import ContactUs from './Pages/ContactUs'
import Menu from './Pages/Menu'
import ContactPage from './Pages/ContactPage'
import AboutPage from './Pages/AboutPage'
import Ex from './Pages/Ex'



const App = () => {
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
      <Header/>
      <Routes>
        {/* <Route path="/" element={<Home/>}/> 
        <Route path="/about" element={<AboutPage/>}/> 
        <Route path="/contactus" element={<ContactPage/>}/> 
        <Route path="/menu" element={<Menu/>}/>  */}

        <Route path="/" element={<Home/>}/> 
        <Route path="/about" element={<About/>}/> 
        <Route path="/contactus" element={<ContactUs/>}/> 
        <Route path="/menu" element={<Menu/>}/>
        {/* <Route path="/EX" element={<Ex/>}/> */}
      </Routes>
      {/* <Footer1/> */}
      <Footer/>
      {/* <Home/> */}
      
    </>
  )
}

export default App