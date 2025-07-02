import React from 'react'

const getImage = (name) => {
  return require(`../assets/sandwich img/${name}`);
};

const Cards = ({item}) => {
  // console.log(item)
  // const a="under budget"
  return (
    <>
      <div className='mt-4 my-3 p-3'>
        <div className="card bg-base-100 w-92 p-3 shadow-xl transition-transform hover:scale-105 dark:bg-slate-900 dark:text-white dark:border">
          <figure>
            <img
              src={item.image}
              alt="Sandwich" />
          </figure>
          <div className="card-body">
            <h2 className="card-title">
              {item.name}
              <div className="badge badge-secondary text-xs">{item.category}</div>
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




// import React from 'react';

// const getImage = (name) => {
//   return require(`../assets/sandwich img/${name}`);
// };

// const Cards = ({ item }) => {
//   return (
//     <>
//       <div className='mt-4 my-3 p-3'>
//         <div className="card bg-base-100 w-92 p-3 shadow-xl transition-transform hover:scale-105 dark:bg-slate-900 dark:text-white dark:border">
//           <figure>
//             <img
//               src={getImage(item.image)} // ✅ Use local image
//               alt={item.name}
//               className="rounded-xl"
//             />
//           </figure>
//           <div className="card-body">
//             <h2 className="card-title">
//               {item.name}
//               <div className="badge badge-secondary text-xs">{item.category}</div>
//             </h2>
//             <p>{item.title}</p>
//             <div className="card-actions flex justify-between">
//               <div className="badge badge-outline">₹{item.price}</div>
//               <div className="hover:bg-pink-500 hover:text-white duration-200 px-3 py-2 rounded-full border-[2px] cursor-pointer">
//                 Buy Now
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Cards;
