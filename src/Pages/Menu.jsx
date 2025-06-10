import React from 'react'
import Navbar from '../Components/Navbar'
import SandwichCard from '../Components/SandwichCard'
import Footer1 from '../Components/Footer1'
import Header from '../Components/Header'
const Menu = () => {
  return (
    <>
      <div>
        {/* <Header/> */}
        {/* <Navbar /> */}
        <div className='max-w-screen-2xl mt-24 container mx-auto md:px-20 px-4'>
          <SandwichCard />
        </div>
        {/* <Footer1 /> */}
      </div>
    </>
  )
}

export default Menu