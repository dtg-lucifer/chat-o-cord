import { useContext, useEffect, useState } from "react";
import {
  Button as ButtonCVA,
  TextField as TextFieldCVA,
} from "../index.components";
import {
  ChatCard,
  ChatWrapper,
  FilterWrapper,
  SearchBarDiv,
  SideBarWrapper,
  TopWrapper,
} from "../index.styled";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../../utils/context/authContext";
import {
  Conversation,
  SafeUser,
  SideBarProps,
  User,
} from "../../../types/conversation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../utils/store";
import { ActiveChatContext } from "../../../utils/context/activeChatContext";
import { useDebouncedTyping } from "../../../utils/hooks/useDebounce";
import { useMutation } from "@tanstack/react-query";
import { createConversation, searchUsers } from "../../../lib/api";
import { toast } from "sonner";
import { addConversations } from "../../../utils/store/slices/conversation.slice";
import { AxiosError } from "axios";
import { useSocket } from "../../../utils/hooks/useSocket";

export default function SideBar({ activeGroup }: SideBarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const { debouncedVal } = useDebouncedTyping(query, 1000);
  const { user: self } = useContext(AuthContext);
  const { activeChat, setActiveChat } = useContext(ActiveChatContext);
  const { socket } = useSocket();
  const dispatch = useDispatch<AppDispatch>();
  const conversations = useSelector(
    (state: RootState) => state.conversation.conversations
  );

  const { mutate: search } = useMutation({
    mutationKey: ["searchConversations", debouncedVal, self?.id],
    mutationFn: (term: string) => searchUsers(term),
    onSuccess: ({ data: users }) => {
      setSearchResults(users);
      if (users.length === 0) toast.error("No one found !!");
    },
    onError: (err) => {
      toast.error("Something went wrong !!");
      console.log(err.message);
    },
  });

  const createConversationHandler = async (user: User) => {
    createConversation({
      userName: user.userName,
      mode: activeGroup!,
    })
      .then((res) => {
        if (res.data) {
          navigate(`/conversations/${activeGroup}/${res.data.id}`);
          setActiveChat(res.data);
          setQuery("");
          setSearchResults([]);
          socket?.emit("conversation:create", {
            conversation: res.data,
            self,
          });
        }
      })
      .catch((err: AxiosError) => {
        if (err.response?.status === 500) {
          console.log("Server Error");
          return toast.error("Conversation already exists !!");
        }
        console.log(err.message);
        return toast.error("Something went wrong !!");
      });
  };

  useEffect(() => {
    if (!debouncedVal) return setSearchResults([]);
    if (debouncedVal === "") return setSearchResults([]);
    search(debouncedVal);
  }, [debouncedVal]);

  useEffect(() => {
    socket?.on(
      "conversation:created",
      (data: { conversation: Conversation; self: SafeUser }) => {
        dispatch(addConversations(data.conversation));
      }
    );

    return () => {
      socket?.off("conversation:created");
    };
  }, [socket]);

  return (
    <SideBarWrapper>
      <TopWrapper>
        <TextFieldCVA
          placeholder="Search..."
          type="text"
          variant="base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <SearchBarDiv
          style={{ display: searchResults.length === 0 ? "none" : "flex" }}
        >
          {searchResults.length !== 0 &&
            searchResults.map(
              (user) =>
                user.id !== self?.id && (
                  <div key={user.id} onClick={(e) => createConversationHandler(user)}>
                    <img src={user.profilePic || "/BLANK.jpeg"} alt="" />
                    <span style={{ cursor: "pointer" }}>{user.userName}</span>
                  </div>
                )
            )}
        </SearchBarDiv>
      </TopWrapper>
      <FilterWrapper
        style={{ display: searchResults.length !== 0 ? "none" : "inline-flex" }}
      >
        <ButtonCVA
          variant={activeGroup === "d" ? "active" : "sideBarFilter"}
          onClick={() => {
            navigate(`/conversations/d`);
          }}
          style={{
            boxShadow: activeGroup === "d" ? "var(--shadow-primary)" : "",
          }}
        >
          Direct
        </ButtonCVA>
        <ButtonCVA
          variant={activeGroup === "g" ? "active" : "sideBarFilter"}
          onClick={() => {
            navigate("/conversations/g");
          }}
          style={{
            boxShadow: activeGroup === "g" ? "var(--shadow-primary)" : "",
          }}
        >
          Group
        </ButtonCVA>
      </FilterWrapper>
      <ChatWrapper
        style={{ display: searchResults.length !== 0 ? "none" : "inline-flex" }}
      >
        {conversations.map((c) => {
          return (
            <ChatCard
              key={c.id}
              onClick={() => {
                setActiveChat(c);
                console.log("Active Chat: ", c);
                navigate(`/conversations/${activeGroup}/${c.id}`);
              }}
              style={{
                backgroundColor:
                  activeChat?.id === c.id.toString()
                    ? "var(--clr-light-bg-faint)"
                    : "",
              }}
            >
              <img
                src={
                  c.creator.id === self?.id
                    ? c.recipient.profilePic || "/BLANK.jpeg"
                    : c.creator.profilePic || "/BLANK.jpeg"
                }
                alt="profile"
              />
              <div className="details__wrapper">
                <h4>
                  {c.creator.id === self?.id
                    ? c.recipient.userName
                    : c.creator.userName}
                </h4>
                <p>
                  {c.messages !== undefined
                    ? c.lastMessageContent
                      ? c.lastMessageContent.slice(0, 30) +
                        (c.lastMessageContent.length > 30 ? "..." : "")
                      : "No messages yet..."
                    : "No messages yet..."}
                </p>
              </div>
            </ChatCard>
          );
        })}
      </ChatWrapper>
    </SideBarWrapper>
  );
}
