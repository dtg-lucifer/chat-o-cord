import { FaPlus, FaSmileWink } from "react-icons/fa";
import {
  TextField as TextFieldCVA,
  Message as MessageCVA,
} from "../index.components";
import {
  ChatBottomWrapper,
  ChatSectionMainWrapper,
  ChatTopWrapper,
  ConversationWrapper,
} from "../index.styled";
import EmojiPicker, { EmojiStyle, SkinTones, Theme } from "emoji-picker-react";
import { useContext, useEffect, useRef, useState } from "react";
import { useDebouncedTyping } from "../../../utils/hooks/useDebounce";
import { ActiveChatContext } from "../../../utils/context/activeChatContext";
import AuthContext from "../../../utils/context/authContext";
import { Message } from "../../../types/conversation";
import {
  addMessages,
  getMessagesAsync,
} from "../../../utils/store/slices/messages.slice";
import { AppDispatch, RootState } from "../../../utils/store";
import { useDispatch, useSelector } from "react-redux";
import { formatDistance, formatRelative } from "date-fns";
import { SocketContext } from "../../../utils/context/socketContext";
import { createMessage } from "../../../lib/api";
import { toast } from "sonner";

export default function ChatSection() {
  const emojiPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [message, setMessage] = useState<string>("");
  const [messagesLocal, setMessagesLocal] = useState<Message[]>([]);

  const { isTyping, debouncedVal } = useDebouncedTyping<string>(message, 2000);
  const { activeChat } = useContext(ActiveChatContext);
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const { loading } = useSelector((state: RootState) => state.messages);

  const { conversations } = useSelector(
    (state: RootState) => state.conversation
  );

  const currentChatUser =
    activeChat?.recipient.id === user?.id
      ? activeChat?.creator
      : activeChat?.recipient;

  const timeStamp = (msg: Message): string => {
    return formatRelative(new Date(msg.createdAt), new Date());
  };

  const showTimeStampAndAvatar = (
    msg: Message,
    i: number,
    msgs: Message[]
  ): boolean => {
    if (i === msgs.length - 1) return true;

    const index = i === msgs.length - 1 ? i : i + 1;

    if (msg.author.id !== msgs[index].author.id) return true;

    if (
      msg.author.id === msgs[index].author.id &&
      timeStamp(msg) === timeStamp(msgs[index])
    )
      return false;

    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    socket.emit("msgSend", {
      content: "",
      convId: activeChat?.id,
      authorId: user?.id,
      file: formData,
    });
  };

  /**
   *! ---- NOTE ----
   *! MAKE THIS FUNCTION WITH REACT-QUERY
   *! SO THAT WE CAN RECEIVE THE MESSAGE FROM THE SERVER AND UPDATE THE UI
   *! SOMETIMES IF THE NETWORK CONNECTION IS SLOW OR THE SERVER TAKES TOO MUCH TO TIME TO RESPOND
   *! THEN THE MESSAGE WILL NOT BE UPDATED IN THE UI
   *! BUT THE MESSAGE WILL BE SENT TO THE SERVER
   *! SO THE MESSAGE WILL FIRST COME UP FADED THEN AFTER SAVING TO THE SERVER IT WILL BE UPDATED
   *! IN CASE OF ERROR THE FADED MESSAGE WILL BE DELETED FROM THE UI
   **/
  const handleMessageSubmit = async () => {
    const messageToSend = message.trim();
    const { data: messageFromApi } = await createMessage({
      content: messageToSend!,
      id: activeChat!.id,
    });

    setMessagesLocal((prevMsgs) => [messageFromApi, ...prevMsgs]);

    socket.emit("message:create", {
      message: messageFromApi,
      authorId: user?.id,
      convId: activeChat?.id,
    });
  };

  useEffect(() => {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        emojiPanelRef.current?.firstElementChild?.classList.remove(
          "emoji__wrapper__active"
        );
      }
    });

    return () => {
      window.removeEventListener("keydown", () => {});
    };
  }, []);

  useEffect(() => {
    if (activeChat) {
      console.log("Active chat", activeChat);
      dispatch(getMessagesAsync({ id: activeChat.id, limit: 100, page: 1 }))
        .unwrap()
        .then((data) => {
          setMessagesLocal(data.data.messages);
        });
    }
    socket.emit("conversation:join", {
      convId: activeChat?.id,
      userId: user?.id,
      userName: user?.userName,
    });
  }, [activeChat, dispatch, socket]);

  /***
   ** TODO: REMOVE ALL THE LOGIC BEFORE SAVING THE MESSAGE TO THE STATE
   *! THOUGH THERES NOTHING TO SAVE IN THE STATE WHILE THE CONVERSATION ID IS DIFFERENT
   *! STILL EVERY OTHER SOCKET WILL RECEIVE THE SAME MESSAGE OVER WEBSOCKET
   *! WHICH WILL LEAD TO PERMONANCE ISSUE
   **/
  useEffect(() => {
    socket.on(
      "message:received",
      (data: { convId: string; message: Message }) => {
        const conv = conversations.find((conv) => conv.id === data.convId);
        if (conv) {
          dispatch(addMessages(data));
          setMessagesLocal((prevMsgs) => [data.message, ...prevMsgs]);
        }
      }
    );

    socket.on("typing:started", ({ userName }) => {
      toast!.loading(`${userName} is typing...`);
    });

    socket.on("typing:stopped", () => {
      toast!.dismiss();
    });

    return () => {
      socket.off("message:received", () => {});
      socket.off("typing:started", () => {});
      socket.off("typing:stopped", () => {});
    };
  }, [socket]);

  useEffect(() => {
    isTyping &&
      socket.emit("typing:start", {
        convId: activeChat?.id,
        userName: user?.userName,
      });

    if (message && !isTyping)
      socket.emit("typing:stop", {
        convId: activeChat?.id,
        userName: user?.userName,
      });
  }, [isTyping]);

  return (
    <ChatSectionMainWrapper>
      <ChatTopWrapper>
        <img src={currentChatUser?.profilePic || "/BLANK.jpeg"} alt="" />
        <span>{currentChatUser?.userName}</span>
        <span>{currentChatUser?.online}</span>
      </ChatTopWrapper>
      <ConversationWrapper>
        {loading ? (
          <h1>Loading...</h1>
        ) : (
          messagesLocal.map((msg, i, msgs) => (
            <MessageCVA
              variant={currentChatUser?.profilePic ? "withImg" : "withoutImg"}
              key={msg?.id}
              style={{
                marginBlockStart: !showTimeStampAndAvatar(msg, i, msgs)
                  ? ""
                  : "0.8rem",
              }}
            >
              {msg.author.profilePic ? (
                <img
                  src={msg.author.profilePic}
                  className="w-10 rounded-full aspect-square"
                  alt="profle_pic"
                  style={{
                    display: showTimeStampAndAvatar(msg, i, msgs) ? "" : "none",
                  }}
                />
              ) : (
                <img
                  src="/BLANK.jpeg"
                  className="w-10 rounded-full aspect-square"
                  alt="profile_pic"
                  style={{
                    display: showTimeStampAndAvatar(msg, i, msgs) ? "" : "none",
                  }}
                />
              )}
              <div className="flex-1">
                <h3
                  style={{
                    display: showTimeStampAndAvatar(msg, i, msgs) ? "" : "none",
                  }}
                  className="font-semibold text-[16px]"
                >
                  {msg.author.userName}
                </h3>
                <p
                  style={{
                    marginInlineStart: showTimeStampAndAvatar(msg, i, msgs)
                      ? ""
                      : "3rem",
                    wordWrap: "break-word",
                    wordBreak: "break-all",
                    whiteSpace: "pre-wrap"
                  }}
                  className=" text-sm text-[#c5c5c5]"
                >
                  {msg.content}
                </p>
              </div>
              <p
                style={{
                  display: showTimeStampAndAvatar(msg, i, msgs) ? "" : "none",
                }}
                className="text-xs text-[#555555] self-start mt-[5px] ml-[3rem]"
              >
                {formatDistance(new Date(msg.createdAt), new Date(), {
                  addSuffix: true,
                })
                  .charAt(0)
                  .toUpperCase() +
                  formatDistance(new Date(msg.createdAt), new Date(), {
                    addSuffix: true,
                  }).slice(1)}
              </p>
            </MessageCVA>
          ))
        )}
      </ConversationWrapper>
      <ChatBottomWrapper>
        <FaPlus size={20} onClick={() => fileInputRef.current?.click()} />
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.mkv,.mp4,.mp3,.m4a,.doc,.docx,.pdf,.ppt,.pptx,.txt"
          hidden
        />
        <TextFieldCVA
          variant={"chat"}
          size={"lg"}
          placeholder="Send something"
          autoFocus
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleMessageSubmit();
              setMessage("");
              socket.emit("typing:stop", {
                convId: activeChat?.id,
                userName: user?.userName,
              });
            }
          }}
        />
        <FaSmileWink
          size={20}
          onClick={() => {
            emojiPanelRef.current?.firstElementChild?.classList.toggle(
              "emoji__wrapper__active"
            );
          }}
        />
        <div
          ref={emojiPanelRef}
          className="emoji__wrapper absolute bottom-[100%] right-0"
        >
          <EmojiPicker
            theme={Theme.DARK}
            defaultSkinTone={SkinTones.NEUTRAL}
            lazyLoadEmojis={true}
            emojiStyle={EmojiStyle.APPLE}
            onEmojiClick={(e) => setMessage((prevMsg) => prevMsg + e.emoji)}
          />
        </div>
      </ChatBottomWrapper>
    </ChatSectionMainWrapper>
  );
}
