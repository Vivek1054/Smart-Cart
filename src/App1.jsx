// import React, { useState } from 'react';
// import { Routes, Route, useLocation } from 'react-router-dom';
// import Header from './Components/Header';
// import Footer from './Components/Footer';
// import Home from './Pages/Home';
// import About from './Pages/About';
// import ContactUs from './Pages/ContactUs';
// import Menu from './Pages/Menu';
// import Login from './Pages/Login';
// import Signup from './Pages/Signup';

// const App1 = () => {
//   const location = useLocation();
//   const [showModal, setShowModal] = useState(false);
//   const [isLogin, setIsLogin] = useState(true); // true = login, false = signup

//   const openLogin = () => {
//     setIsLogin(true);
//     setShowModal(true);
//   };

//   const openSignup = () => {
//     setIsLogin(false);
//     setShowModal(true);
//   };

//   const closeModal = () => setShowModal(false);

//   return (
//     <>
//       {/* Background content that should be blurred */}
//       <div className={showModal ? 'blur-sm pointer-events-none select-none' : ''}>
//         <Header onLoginClick={openLogin} />
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/about" element={<About />} />
//           <Route path="/contactus" element={<ContactUs />} />
//           <Route path="/menu" element={<Menu />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/signup" element={<Signup />} />
//         </Routes>
//         <Footer />
//       </div>

//       {/* Modal (NOT blurred) */}
//       {showModal && (
//         <div className="fixed inset-36 z-100 flex items-center justify-center bg-black bg-opacity-40">
//           <div className="bg-transparent p-8 rounded-lg shadow-lg relative w-full max-w-md mx-auto z-50">
//             <button
//               className="absolute top-10 right-10 text-xl cursor-pointer font-bold text-gray-600 hover:text-black"
//               onClick={closeModal}
//             >

//             </button>

//             {isLogin ? (
//               <>
//                 <Login />
//                 <p className="text-center text-sm mt-4">
//                   Don’t have an account?{' '}
//                   <button
//                     onClick={() => setIsLogin(false)}
//                     className="text-yellow-600 underline"
//                   >
//                     Sign up here
//                   </button>
//                 </p>
//               </>
//             ) : (
//               <>
//                 <Signup />
//                 <p className="text-center text-sm mt-4">
//                   Already have an account?{' '}
//                   <button
//                     onClick={() => setIsLogin(true)}
//                     className="text-yellow-600 underline"
//                   >
//                     Login here
//                   </button>
//                 </p>
//               </>
//             )}
//           </div>
//         </div>
//       )}
//     </>

//   );
// };

// export default App1;



import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './Components/Header';
import Footer from './Components/Footer';
import Home from './Pages/Home';
import About from './Pages/About';
import ContactUs from './Pages/ContactUs';
import Menu from './Pages/Menu';
import Login from './Pages/Login';
import Signup from './Pages/Signup';

const App1 = () => {
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // true = login, false = signup

  const openLogin = () => {
    setIsLogin(true);
    setShowModal(true);
  };

  const openSignup = () => {
    setIsLogin(false);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  return (
    <>
      {/* Background content that should be blurred when modal is open */}
      <div className={showModal ? 'blur-sm pointer-events-none select-none' : ''}>
        <Header onLoginClick={openLogin} onSignupClick={openSignup} />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contactus" element={<ContactUs />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>

        <Footer />
      </div>

      {/* Modal Content */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-40 pt-24 px-4 pb-24">
          <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            {/* Close Button */}
            <button
              className="absolute top-3 right-3 text-2xl font-bold text-gray-500 hover:text-red-500"
              onClick={closeModal}
            >
              &times;
            </button>

            {/* Modal Inner Content */}
            {isLogin ? (
              <>
                <Login />
                <p className="text-center text-sm mt-4">
                  Don’t have an account?{' '}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-yellow-600 underline"
                  >
                    Sign up here
                  </button>
                </p>
              </>
            ) : (
              <>
                <Signup />
                <p className="text-center text-sm mt-4">
                  Already have an account?{' '}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="text-yellow-600 underline"
                  >
                    Login here
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default App1;
