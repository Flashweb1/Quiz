export const ease = [0.25, 0.1, 0.25, 1]

export const entranceVariants = (delay = 0) => ({
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease, delay } },
})

export const entrance = (delay = 0) => ({
  initial: { y: 24, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.5, ease, delay },
})

export const hoverLift = {
  y: -3,
  transition: { duration: 0.2, ease },
}

export const tapScale = {
  scale: 0.97,
  transition: { duration: 0.1 },
}

export const springCounter = { stiffness: 80, damping: 15 }
