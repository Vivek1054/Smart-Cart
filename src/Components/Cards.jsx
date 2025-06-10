import React from 'react'

const Cards = ({item}) => {
  // console.log(item)
  const a="under budget"
  return (
    <>
      <div className='mt-4 my-3 transition-transform hover:scale-90 active:scale-95 '>
        <div className="card bg-base-100 w-92 p-3 shadow-xl">
          <figure>
            <img
              src={item.image}
              alt="Shoes" />
          </figure>
          <div className="card-body">
            <h2 className="card-title">
              {item.name}
              <div className="badge badge-secondary text-xs">{a}</div>
            </h2>
            <p>{item.title}</p>
            <div className="card-actions flex justify-between">
              <div className="badge badge-outline">${item.price}</div>
              <div className=" hover:bg-pink-500 hover:text-white duration-200 px-3 py-2 rounded-full border-[2px] cursor-pointer">Buy Now</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Cards