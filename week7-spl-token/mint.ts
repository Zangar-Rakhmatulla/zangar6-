import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import fs from "fs";
import os from "os";

const secret = JSON.parse(
  fs.readFileSync(os.homedir() + "/.config/solana/id.json", "utf8")
);
const payer = Keypair.fromSecretKey(Uint8Array.from(secret));
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

(async () => {
  // 1. Токен (mint) жасау, 9 decimals
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey, // mint authority
    null,            // freeze authority
    9,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
  console.log("Mint:", mint.toBase58());

  // 2. Өз walletыңызға token account ашу
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
  console.log("Token account:", ata.address.toBase58());

  // 3. 1000 токен шығару
  const sig = await mintTo(
    connection,
    payer,
    mint,
    ata.address,
    payer,
    1000n * 10n ** 9n,
    [],
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
  console.log("Mint tx:", sig);
  console.log("Explorer: https://explorer.solana.com/tx/" + sig + "?cluster=devnet");

  fs.writeFileSync("mint.json", JSON.stringify({ mint: mint.toBase58(), ata: ata.address.toBase58() }));
})();