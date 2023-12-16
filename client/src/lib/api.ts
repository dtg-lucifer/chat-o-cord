import {
  GetMessagesData,
  LoginData,
  RegisterData,
} from "../types/authentication";
import axios from "axios";
import { Conversation, Message, User } from "../types/conversation";

export const registerUser = async (data: RegisterData) => {
  return await axios.post<Partial<Omit<User, "password">>>(
    `${process.env.REACT_APP_PUBLIC_API_URL}/auth/register`,
    data,
    {
      withCredentials: true,
      params: {
        redirect: "/",
      },
    }
  );
};

export const loginUser = async (data: LoginData) => {
  return await axios.post<Partial<Omit<User, "password">>>(
    `${process.env.REACT_APP_PUBLIC_API_URL}/auth/login`,
    data,
    {
      withCredentials: true,
      params: {
        redirect: "/",
      },
    }
  );
};

export const getStatus = async () => {
  return await axios.get<Omit<Omit<User, "password">, "confPassword">>(
    `${process.env.REACT_APP_PUBLIC_API_URL}/auth/me`,
    {
      withCredentials: true,
      params: {
        redirect: "/",
      },
    }
  );
};

export const getConversations = async (mode: string) => {
  return await axios.get<Conversation[]>(
    `${process.env.REACT_APP_PUBLIC_API_URL}/conversation/${mode}`,
    {
      withCredentials: true,
      params: {
        redirect: "/",
      },
    }
  );
};

export const getMessages = async (data: GetMessagesData) => {
  return await axios.get<{ id: string; messages: Message[] }>(
    `${process.env.REACT_APP_PUBLIC_API_URL}/message/${data.id}`,
    {
      withCredentials: true,
      params: {
        limit: data.limit,
        page: data.page,
      },
    }
  );
};

export const createMessage = async (data: { content: string; id: string }) => {
  return await axios.post<Message>(
    `${process.env.REACT_APP_PUBLIC_API_URL}/message`,
    data,
    { withCredentials: true }
  );
};
