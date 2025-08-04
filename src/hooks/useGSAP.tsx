import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const useGSAP = () => {
  const contextRef = useRef<gsap.Context>();

  useEffect(() => {
    contextRef.current = gsap.context(() => {});
    
    return () => {
      contextRef.current?.revert();
    };
  }, []);

  return contextRef.current;
};

// Animação para entrada de elementos
export const animateIn = (elements: string | Element[], options = {}) => {
  return gsap.fromTo(elements, 
    { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    { 
      opacity: 1, 
      y: 0,
      scale: 1,
      duration: 0.8,
      ease: "power2.out",
      stagger: 0.1,
      ...options
    }
  );
};

// Animação para hover em botões
export const animateHover = (element: string | Element) => {
  const tl = gsap.timeline({ paused: true });
  
  tl.to(element, {
    scale: 1.05,
    duration: 0.3,
    ease: "power2.out"
  });
  
  return tl;
};

// Animação para carregamento
export const animateLoading = (element: string | Element) => {
  return gsap.to(element, {
    rotation: 360,
    duration: 1,
    ease: "none",
    repeat: -1
  });
};