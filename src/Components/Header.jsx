// import React from 'react'
// import Navbar from './Navbar'


// const Header = () => {
//   return (
//     <>
//       <Navbar/>

//     </>
//   )
// }

// export default Header

import React from 'react';
import Navbar from './Navbar';
import Navbar1 from './Navbar1';

const Header = ({ onLoginClick }) => {
  return (
    <>
      {/* <Navbar onLoginClick={onLoginClick} /> */}
      <Navbar1 onLoginClick={onLoginClick} />
    
    </>
  );
};

export default Header;
