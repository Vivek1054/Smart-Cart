import React from 'react'
import Banner from '../Components/Banner'
import SandwichCard from '../Components/SandwichCard'
import Footer1 from '../Components/Footer1'
import Navbar from '../Components/Navbar'
import Header from '../Components/Header'

const Home = () => {
  return (
    <>
      {/* <Header/> */}
      <div className='max-w-screen-2xl container mx-auto md:px-20 px-4'>

        <Banner />
        <SandwichCard />
      </div>
      {/* <Footer1/> */}
    </>
  )
}

export default Home