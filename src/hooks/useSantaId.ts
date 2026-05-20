import { useState } from "react";

const LS_KEY = 'SANTAUniqId';

const generateNumber = () => {
  return Math.floor(100000 + Math.random() * 900000);
}

/**
 * set and return UID from LS
 */
const useSantaId = () => {
  const [id] = useState<string>(() => {
    const params = new URLSearchParams(location.search);

    if (params.has('nid')) {
      const forcedId = params.get('nid');
      if (forcedId && /^\d{6}$/.test(forcedId)) {
        localStorage.setItem(LS_KEY, forcedId);
      }
      history.replaceState(null, '', location.pathname);
    }

    if (!localStorage.getItem(LS_KEY)) {
      const randomNumber = generateNumber().toString();
      localStorage.setItem(LS_KEY, randomNumber);
    }

    return localStorage.getItem(LS_KEY) as string;
  });

  return id;
};

export default useSantaId;