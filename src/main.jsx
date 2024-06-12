import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from 'react-router-dom'

// project styles
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

import About from './About'
import App from './App'
import ErrorPage from './ErrorPage'
import Header from './Header'
import Footer from './Footer'

import { AuthContext } from './authContext'
import { useState } from 'react'
import { useEffect } from 'react'

function Layout() {
  return (
      <>
        <div id='page-content'>
          <Outlet />
        </div>
      </>
  )
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <App />,
        errorElement: <ErrorPage />
      },
      {
        path: '/about',
        element: <About />
      },
    ]
  }
])

const AuthContextProvider = ({children}) => {
  const [accessToken, setAccessToken] = useState([])
  //const [username, setUsername] = useState("")
  //const [userID, setUserID] = useState(0)

  useEffect(() => {
    //check our local storage for these items on page load
    const checkAccess = localStorage.getItem("access")
    //const checkUsername = localStorage.getItem("username")
    //const checkID = Number(localStorage.getItem("userID"))

    if (checkAccess) { //valid, not undefined
      setAccessToken(checkAccess)
      //setUsername(checkUsername)
      //setUserID(checkID)
    }
  }, [])

  const auth = {
    accessToken: accessToken,
    setAccessToken: setAccessToken,
    //username: username,
    //setUsername: setUsername,
    //userID: userID,
    //setUserID: setUserID,
  }

  return (
    <AuthContext.Provider value={{ auth: auth }}>
      {children}
    </AuthContext.Provider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthContextProvider>
    <RouterProvider router={router} />
  </AuthContextProvider>
)