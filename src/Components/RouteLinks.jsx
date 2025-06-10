import React from 'react'
import { Link } from 'react-router-dom'

const RouteLinks = () => {
    return (
        <>
            {/* <li><Link to='/'>Home</Link></li>
            <li><Link to='/about'>About</Link></li>
            <li><Link to='/contactus'>Contact</Link></li>
            <li><Link to='/menu'>Menu</Link></li> */}

            <Link className="link link-hover" to='/'>Home</Link>
            <Link className="link link-hover" to='/about'>About</Link>
            <Link className="link link-hover" to='/contactus'>Contact</Link>
            <Link className="link link-hover" to='/menu'>Menu</Link>
            {/* <Link className="link link-hover" to='/Ex'>EX</Link> */}
        </>
    )
}

export default RouteLinks