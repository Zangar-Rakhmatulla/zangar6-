import {
  Connection, Keypair, SystemProgram, Transaction,
  clusterApiUrl, sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ExtensionType, TOKEN_2022_PROGRAM_ID, LENGTH_SIZE, TYPE_SIZE,
  createInitializeMintInstruction,
  createInitializeMetadataPointerInstruction,
  getMintLen, getTokenMetadata,
  getOrCreateAssociatedTokenAccount, mintTo,
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";
import fs from "fs";
import os from "os";

const secret = JSON.parse(
  fs.readFileSync(os.homedir() + "/.config/solana/id.json", "utf8")
);
const payer = Keypair.fromSecretKey(Uint8Array.from(secret));
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

(async () => {
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;
  const decimals = 9;

  const metadata = {
    mint,
    name: "Zangar Token",
    symbol: "ZNG",
    uri: "https://example.com/zng.json",
    additionalMetadata: [] as [string, string][],
  };

  const mintLen = getMintLen([ExtensionType.MetadataPointer]);
  const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
  const lamports = await connection.getMinimumBalanceForRentExemption(
    mintLen + metadataLen
  );

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeMetadataPointerInstruction(
      mint, payer.publicKey, mint, TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mint, decimals, payer.publicKey, null, TOKEN_2022_PROGRAM_ID
    ),
    createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      metadata: mint,
      updateAuthority: payer.publicKey,
      mint,
      mintAuthority: payer.publicKey,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
    })
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair]);
  console.log("Mint:", mint.toBase58());
  console.log("Create tx:", sig);

  // Токен шығару
  const ata = await getOrCreateAssociatedTokenAccount(
    connection, payer, mint, payer.publicKey,
    false, undefined, undefined, TOKEN_2022_PROGRAM_ID
  );
  const mintSig = await mintTo(
    connection, payer, mint, ata.address, payer,
    1000n * 10n ** 9n, [], undefined, TOKEN_2022_PROGRAM_ID
  );
  console.log("Mint tx:", mintSig);

  // Metadata-ны оқып тексеру
  const onchain = await getTokenMetadata(connection, mint);
  console.log("On-chain metadata:", onchain);

  console.log("Explorer: https://explorer.solana.com/address/" + mint.toBase58() + "?cluster=devnet");
})();