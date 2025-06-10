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
    const filterData = list.filter((data) => data.category === "premium sandwiches")
    // console.log(filterData)

    return (
        <>
            <div className='max-w-screen-2xl container mx-auto md:px-20 px-4'>
                <div>

                    <h1 className='font-semibold text-xl pb-2'>Under 40 rupee</h1>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Repudiandae,
                        vel assumenda at aspernatur neque alias officiis nisi facilis ut reiciendis
                        saepe quam quasi sint porro ipsum, laudantium nobis adipisci. Officia.
                    </p>
                </div>


                <div>
                    <Slider {...settings}>
                        {filterData.map((item)=>(
                            <Cards item={item} key={item.id}/>
                        ))}
                        
                    </Slider>
                </div>
            </div>
        </>
    )
}

export default SandwichCard