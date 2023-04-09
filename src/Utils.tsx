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

const parseSearches = (text: string): string[] => {
  const pattern = /\[search:(.*)\]/gm;
  const matches = Array.from(text.matchAll(pattern));
  return matches.map(m => m[1].trim());
}

const performSearch = (search: string): Promise<string[]> => {
  console.log('performing a search')
  return Promise.resolve([`some specific information about ${search}`]);
}

export { ScrollToTop, getChat, parseSearches, performSearch }