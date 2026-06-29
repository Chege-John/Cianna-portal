const Pusher = require("pusher");

const PusherClass = typeof Pusher === "function" ? Pusher : (Pusher as any).default || Pusher;

export const pusherServer = new PusherClass({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

const PusherClientClass = typeof window !== "undefined" ? require("pusher-js") : null;

export const pusherClient = PusherClientClass
  ? new PusherClientClass(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      }
    )
  : null as any;
