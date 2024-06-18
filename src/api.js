import axios from 'axios'

//REMEMBER TO CLOSE ANY OPEN LOCAL TABS BEFORE CHANGING THE COMMENTS ON THESE, ELSE YOU'LL CREATE ZOMBIE CLIENTS

export const debug = true //change to FALSE for production!

export const baseUrl = 'http://127.0.0.1:8000' //local dev
//export const baseUrl = 'https://witch-chess-backend.fly.dev' //production

export const wsBaseUrl = "127.0.0.1:8000" //local dev
//export const wsBaseUrl = "witch-chess-backend.fly.dev" //production

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
    }).catch(error => console.log('ERROR: ', error))
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

// const getUserID = (accessToken, auth) => {
//     axios({
//         method: 'get',
//         url: `${baseUrl}/user-id/`,
//         headers: {
//             Authorization: `Bearer ${accessToken}`
//         },
//     }).then(response => {
//         console.log("GET USER RESPONSE: ", response)
//         auth.setUserID(response.data.id)
//         localStorage.setItem("userID", response.data.id)
//     }).catch(error => console.log("ERROR: ", error))
// }

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
        console.log('FETCH LOBBIES RESPONSE: ', response)
        setLobbies(response.data)
    }).catch(error => console.log("ERROR: ", error))
}