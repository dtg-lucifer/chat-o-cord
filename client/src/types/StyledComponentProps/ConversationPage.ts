export type PageWrapperProps = Partial<{
    readonly display: string;
    readonly fdirection: "column" | "row";
    readonly justifyContent: string;
    readonly alignItems: string;
    readonly gap: number;
}>

export interface SIdeBarProps {
    readonly bottomLine: boolean;
}

export interface MiniChatCardProps {
    readonly img: string;
    readonly name: string;
    readonly lastMsg?: string | undefined;
}

export interface ChatCardOuterProps {
    readonly key: number;
    readonly arrLength: number;
}

export interface ConversationPageStateProps {
    readonly channelActive: boolean;
}