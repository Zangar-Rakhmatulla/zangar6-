import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import fs from "fs";
import os from "os";

const secret = JSON.parse(
  fs.readFileSync(os.homedir() + "/.config/solana/id.json", "utf8")
);
const payer = Keypair.fromSecretKey(Uint8Array.from(secret));
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const { mint, ata } = JSON.parse(fs.readFileSync("mint.json", "utf8"));
const mintPk = new PublicKey(mint);
const sourceAta = new PublicKey(ata);

(async () => {
  // Алушы: жаңа кездейсоқ wallet
  const receiver = Keypair.generate();
  console.log("Receiver:", receiver.publicKey.toBase58());

  const receiverAta = await getOrCreateAssociatedTokenAccount(
    connection, payer, mintPk, receiver.publicKey,
    false, undefined, undefined, TOKEN_2022_PROGRAM_ID
  );

  const sig = await transfer(
    connection, payer, sourceAta, receiverAta.address, payer,
    100n * 10n ** 9n, [], undefined, TOKEN_2022_PROGRAM_ID
  );
  console.log("Transfer tx:", sig);
  console.log("Explorer: https://explorer.solana.com/tx/" + sig + "?cluster=devnet");

  const a = await getAccount(connection, sourceAta, undefined, TOKEN_2022_PROGRAM_ID);
  const b = await getAccount(connection, receiverAta.address, undefined, TOKEN_2022_PROGRAM_ID);
  console.log("Sender balance:", Number(a.amount) / 1e9);
  console.log("Receiver balance:", Number(b.amount) / 1e9);
})();