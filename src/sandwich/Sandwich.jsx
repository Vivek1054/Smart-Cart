import React from 'react'
import Navbar from '../Components/Navbar'
import Header from '../Components/Header'
import SandwichCard from '../Components/SandwichCard'
import Footer1 from '../Components/Footer1'
import Footer from '../Components/Footer'
import Menu from '../Pages/Menu'
import list from '../assets/list.json'



const Sandwich = () => {
  return (
    <>
        <Header/>
        <div className='min-h-screen'>
            <Menu/>


        </div>
        <Footer/>
    </>
  )
}

export default Sandwich