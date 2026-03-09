import { useState } from "react";

const LS_KEY = 'SANTAUniqId';

const generateNumber = () => {
  return Math.floor(100000 + Math.random() * 900000);
}

/**
 * returns UID from LS
 */
const useSantaId = () => {
  const [id] = useState<string>(() => {
    if (!localStorage.getItem(LS_KEY)) {
      const randomNumber = generateNumber().toString();
      localStorage.setItem(LS_KEY, randomNumber);
    }

    return localStorage.getItem(LS_KEY) as string;
  });

  return id;
};

export default useSantaId;