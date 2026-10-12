import { Connection, Keypair, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import fs from "fs";
import os from "os";

const secret = JSON.parse(
  fs.readFileSync(os.homedir() + "/.config/solana/id.json", "utf8")
);
const payer = Keypair.fromSecretKey(Uint8Array.from(secret));
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

(async () => {
  console.log("Wallet:", payer.publicKey.toBase58());
  const bal = await connection.getBalance(payer.publicKey);
  console.log("Balance:", bal / LAMPORTS_PER_SOL, "SOL");
})();