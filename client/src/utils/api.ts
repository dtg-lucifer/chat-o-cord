import axios, { AxiosRequestConfig } from "axios"
import { CreateUserParams, LoginUserParams, User } from "../types/Utils/Authentication"

const { REACT_APP_API_BASE_URL } = process.env
const axiosConfig: AxiosRequestConfig = { withCredentials: true, }

export const RegisterUser = async (data: CreateUserParams) => {
    return await axios.post(`${REACT_APP_API_BASE_URL}/auth/register`, data, axiosConfig)
}

export const LoginUser = async (data: LoginUserParams) => {
    return await axios.post(`${REACT_APP_API_BASE_URL}/auth/login`, data, axiosConfig)
}

export const GetAuthDetails = () => axios.get<User>(`${REACT_APP_API_BASE_URL}/auth/status`, axiosConfig)