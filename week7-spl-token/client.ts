import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  getTokenMetadata,
  transfer,
} from "@solana/spl-token";
import fs from "fs";
import os from "os";

const secret = JSON.parse(
  fs.readFileSync(os.homedir() + "/.config/solana/id.json", "utf8")
);
const payer = Keypair.fromSecretKey(Uint8Array.from(secret));
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const MINT = new PublicKey("HbaiSWtyAGVYkXfRbkikhnrFhuzD6aJY9mGkeG9GiFSB");

(async () => {
  // 1. Metadata оқу
  const md = await getTokenMetadata(connection, MINT);
  console.log("Token:", md?.name, `(${md?.symbol})`);

  // 2. Өз балансым
  const myAta = getAssociatedTokenAddressSync(
    MINT, payer.publicKey, false, TOKEN_2022_PROGRAM_ID
  );
  const before = await getAccount(connection, myAta, undefined, TOKEN_2022_PROGRAM_ID);
  console.log("My balance:", Number(before.amount) / 1e9);

  // 3. Transfer: 50 токен жаңа walletқа
  const receiver = Keypair.generate();
  const receiverAta = await getOrCreateAssociatedTokenAccount(
    connection, payer, MINT, receiver.publicKey,
    false, undefined, undefined, TOKEN_2022_PROGRAM_ID
  );
  const sig = await transfer(
    connection, payer, myAta, receiverAta.address, payer,
    50n * 10n ** 9n, [], undefined, TOKEN_2022_PROGRAM_ID
  );
  console.log("Transfer tx:", sig);
  console.log("Explorer: https://explorer.solana.com/tx/" + sig + "?cluster=devnet");

  // 4. Нәтиже
  const after = await getAccount(connection, myAta, undefined, TOKEN_2022_PROGRAM_ID);
  const rec = await getAccount(connection, receiverAta.address, undefined, TOKEN_2022_PROGRAM_ID);
  console.log("My balance after:", Number(after.amount) / 1e9);
  console.log("Receiver balance:", Number(rec.amount) / 1e9);
})();