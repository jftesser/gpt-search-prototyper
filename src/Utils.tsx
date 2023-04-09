import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Message } from "./types";
import { getChat as getFBChat } from "./firebase/firebaseSetup";

const ScrollToTop = () => {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (hash === '') {
      window.scrollTo(0, 0);
    }
    else {
      setTimeout(() => {
        const id = decodeURIComponent(hash.replace('#', ''));
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView();
        }
      }, 0);
    }
  }, [pathname, hash, key]);

  return null;
}

const getChat = (messages: Message[], temp: number, callback: Function) => {
  getFBChat({ messages, temp }).then((result) => {
    const data: any = result.data;
    callback(data);
  });
}

export { ScrollToTop, getChat }