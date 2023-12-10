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
import { getMessagesAsync } from "../../../utils/store/slices/messages.slice";
import { AppDispatch, RootState } from "../../../utils/store";
import { useDispatch, useSelector } from "react-redux";
import { formatDistance, formatRelative } from "date-fns";

export default function ChatSection() {
  const emojiPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [message, setMessage] = useState<string>("");

  const { debouncedVal, isTyping } = useDebouncedTyping<string>(message, 2000);
  const { activeChat } = useContext(ActiveChatContext);
  const { user } = useContext(AuthContext);

  const { messages, loading } = useSelector(
    (state: RootState) => state.messages
  );
  const activechatMessages = messages.find(
    (msg) => msg.convId === activeChat!.id
  );

  const currentChatUser =
    activeChat?.recipient.id === user?.id
      ? activeChat?.creator
      : activeChat?.recipient;

  const timeStamp = (msg: Message): string => {
    return formatRelative(new Date(msg.createdAt), new Date())
  };

  const showTimeStampAndAvatar = (
    msg: Message,
    i: number,
    msgs: Message[]
  ): boolean => {
    if (i === msgs.length - 1) return true;

    const index = i === msgs.length - 1 ? i : i + 1;

    if (msg.author.id !== msgs[index].author.id) return true;
    
    if (msg.author.id === msgs[index].author.id && timeStamp(msg) === timeStamp(msgs[index])) return false;

    return true
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
    isTyping && console.log("Typing starts", debouncedVal);

    if (message && !isTyping) {
      console.log("Typing ends", debouncedVal);
    }
  }, [isTyping]);

  useEffect(() => {
    if (activeChat) {
      console.log("Active chat", activeChat);
      dispatch(getMessagesAsync({ id: activeChat.id, limit: 100, page: 1 }))
        .unwrap()
        .then(() => {
          //! Show some thing
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [activeChat]);

  return (
    <ChatSectionMainWrapper>
      <ChatTopWrapper>
        <img src={currentChatUser?.profilePic || "/BLANK.jpeg"} alt="" />
        {currentChatUser?.userName}
      </ChatTopWrapper>
      <ConversationWrapper>
        {loading ? (
          <h1>Loading...</h1>
        ) : (
          activechatMessages?.messages.map((msg, i, msgs) => (
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
                  }}
                  className="text-sm text-[#c5c5c5]"
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
