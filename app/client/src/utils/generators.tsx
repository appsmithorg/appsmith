import generate from 'nanoid/generate'

const ALPHABET = "1234567890abcdefghijklmnopqrstuvwxyz"

export const generateReactKey = ({prefix = ""}: {prefix?: string}={}): string => {
  return prefix + generate(ALPHABET, 10)
}

export default {
  generateReactKey
}