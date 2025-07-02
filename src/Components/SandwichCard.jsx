import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";

import React from 'react'
import list from '../assets/list.json'
import Cards from "./Cards";


const SandwichCard = () => {




    var settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 3,
        initialSlide: 0,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                    infinite: true,
                    dots: true
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                    initialSlide: 2
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    };

    // const filterData = list.filter((data) => data.category === "under 40 rupee")
    const filterData = list.filter((data) => data.category === "under 40 rupee")
    // console.log(filterData)

    return (
        <>
            <div className="font-sans text-gray-800">
                {/* Hero */}
                <section className="relative h-60 flex items-center justify-center bg-[url('../assets/contact-hero.jpg')] bg-cover bg-center">
                    <div className="absolute inset-0 bg-black/50 container mx-auto md:px-20 px-4"></div>
                    <div className="relative z-10 text-center text-white px-4">
                        <h1 className="text-5xl font-bold mb-4">Under Budget</h1>
                        <p className="text-xl">We'd love to hear from you</p>
                    </div>
                </section>
            </div>
            <div className='max-w-screen-2xl container mx-auto md:px-20 px-4'>
                {/* <div>

                    <h1 className='font-semibold text-xl pb-2'>Under 40 rupee</h1>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Repudiandae,
                        vel assumenda at aspernatur neque alias officiis nisi facilis ut reiciendis
                        saepe quam quasi sint porro ipsum, laudantium nobis adipisci. Officia.
                    </p>
                </div> */}


                <div>
                    <Slider {...settings}>
                        {filterData.map((item) => (
                            <Cards item={item} key={item.id} />
                        ))}

                    </Slider>
                </div>
            </div>
        </>
    )
}

export default SandwichCard