import axios from 'axios'

//REMEMBER TO CLOSE ANY OPEN LOCAL TABS BEFORE CHANGING THE COMMENTS ON THESE, ELSE YOU'LL CREATE ZOMBIE CLIENTS

export const debug = true //change to FALSE for production!

export const baseUrl = import.meta.env.VITE_BASEURL
export const wsBaseUrl = import.meta.env.VITE_WSBASEURL

//helper functions

export function saveLogin(authToken, authRefresh) {
    localStorage.setItem("access", authToken)
    localStorage.setItem("refresh", authRefresh)
    console.log("Saved login information.")
}

export function deleteLogin() {
    localStorage.removeItem("access")
    localStorage.removeItem("refresh")
    console.log("Deleted old login information.")
}

//user auth

export const createUser = ({username, password, email}) => {
    axios({
        method: 'post',
        url: `${baseUrl}/create-user/`,
        data: {
            username,
            password,
            email,
        }
    }).then(response => {
        console.log("CREATE USER RESPONSE: ", response)
        if (response.status === 200 || response.status === 201 || response.status === 202) {
            alert("Account created successfully! Please log in.")
        } else {
            alert("Account creation failed! Please check your connection/the information you entered and try again!")
        }
    }).catch(error => {
        console.log('ERROR: ', error)
        alert("Account creation failed! Please check your connection/the information you entered and try again!")
    })
}

export const getToken = ({ auth, username, password }) => {
    axios.post(`${baseUrl}/token/`, {
        username,
        password,
    }).then(response => {
        auth.setAccessToken(response.data.access)
        // getUserID(response.data.access, auth)
        saveLogin(response.data.access, response.data.refresh)
    }).catch(error => console.log("ERROR: ", error))
}

export const fetchUser = ({ auth }) => {
    axios({
        method: 'get',
        url: `${baseUrl}/profile/`,
        headers: {
            Authorization: `Bearer ${auth.accessToken}`
        },
    }).then(response => {
        console.log('FETCH USER RESPONSE: ', response)
    }).catch(error => console.log("ERROR: ", error))
}

export const fetchLobbies = ({ auth, setLobbies }) => {
    axios({
        method: 'get',
        url: `${baseUrl}/lobbies/`,
        headers: {
            Authorization: `Bearer ${auth.accessToken}`
        },
    }).then(response => {
        //console.log('FETCH LOBBIES RESPONSE: ', response)
        setLobbies(response.data)
    }).catch(error => console.log("ERROR: ", error))
}

export const getWins = ({auth, setWins}) => {
    axios({
        method: 'get',
        url: `${baseUrl}/get-win/`,
        headers: {
            Authorization: `Bearer ${auth.accessToken}`
        },
    }).then(response => {
        setWins(response.data)
    }).catch(error => console.log("ERROR: ", error))
}

export const addWin = ({auth}) => {
    axios({
        method: 'post',
        url: `${baseUrl}/add-win/`,
        headers: {
            Authorization: `Bearer ${auth.accessToken}`
        },
        data: {
            "win": "win"
        },
    }).then(response => console.log("RESPONSE: ", response)
    ).catch(error => console.log("ERROR: ", error))
}