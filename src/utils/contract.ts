import EthCrypto from "eth-crypto"
import { ethers } from "ethers"

import abi from "@abi"

async function send(to: string, message: string) {
  let contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3"

  const provider = window["ethereum"]

  if (!provider) {
    throw Error("Not connected!")
  }

  const ethersProvider = new ethers.providers.Web3Provider(provider)

  // @todo make multichain
  let etherscanProvider = new ethers.providers.EtherscanProvider()

  const history = await etherscanProvider.getHistory(to)

  const previousTx = history[0]

  if (!previousTx) {
    throw new Error("No previous transaction found")
  }

  const theTx = await ethersProvider.getTransaction(
    "0x9e1305489c8d9e6f0eba94fbae6c5402c2c7d719a0e370b3ca20a11fa3602968"
  )

  console.log("tx", theTx)

  const pubKey = await getPublicKey(theTx)

  console.log("pubkey", pubKey, ethers.utils.computeAddress(pubKey))

  const encrypted = await EthCrypto.encryptWithPublicKey(
    pubKey.slice(2),
    message
  )

  const encryptedMessage = EthCrypto.cipher.stringify(encrypted)

  console.log("encrypted", encryptedMessage)

  const contract = new ethers.Contract(
    contractAddress,
    abi,
    ethersProvider.getSigner()
  )

  const tx = await contract.send(to, encryptedMessage, true)
  await tx.wait()
}

export { send }

// See https://gist.github.com/chrsengel/2b29809b8f7281b8f10bbe041c1b5e00
async function getPublicKey(tx: any) {
  const expandedSig = {
    r: tx.r,
    s: tx.s,
    v: tx.v,
  }
  const signature = ethers.utils.joinSignature(expandedSig)
  const rsTx = await ethers.utils.resolveProperties(tx)
  const raw = ethers.utils.serializeTransaction(rsTx) // returns RLP encoded tx
  const msgHash = ethers.utils.keccak256(raw) // as specified by ECDSA
  const msgBytes = ethers.utils.arrayify(msgHash) // create binary hash
  const recoveredPubKey = ethers.utils.recoverPublicKey(msgBytes, signature)

  return recoveredPubKey
}
