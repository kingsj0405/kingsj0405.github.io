# Samjong — Codex Pet

Samjong is a Codex-compatible v2 animated pet inspired by Sejong Yang's [Sheep Three Bell](https://yangspace.co.kr/#sheep-three-bell) motif.

Preview it at **[yangspace.co.kr/pets/samjong](https://yangspace.co.kr/pets/samjong/)**.

## Install with Codex

Copy this request into a Codex task:

> Install the Samjong Codex pet from https://yangspace.co.kr/pets/samjong/codex-pet.json. Verify the listed SHA-256 checksums, install pet.json and spritesheet.webp into my local Codex pets directory, then tell me how to select and wake it.

The distribution contains no installer or executable code. Codex only needs to download and verify these two files:

| File | Purpose | SHA-256 |
| --- | --- | --- |
| [`pet.json`](https://yangspace.co.kr/pets/samjong/pet.json) | Pet metadata | `7faa802c8b612fac5c72ff07c1d7ac8a548595961220b8dff3c3cb80a20ea7d8` |
| [`spritesheet.webp`](https://yangspace.co.kr/pets/samjong/spritesheet.webp) | 1536×2288 transparent v2 animation atlas | `2fd74155a9fbba9ebd367b767db56518ac878bf47c0315922a39e344effc170e` |

The machine-readable distribution manifest is [`codex-pet.json`](https://yangspace.co.kr/pets/samjong/codex-pet.json).

## Manual install

Place both files together in the local Codex pet directory:

```text
~/.codex/pets/samjong/
├── pet.json
└── spritesheet.webp
```

Then open **Codex → Settings → Pets**, choose **Refresh**, select **Samjong**, and wake the pet. See the [official OpenAI pet guide](https://learn.chatgpt.com/ko-KR/docs/pets) for the current desktop and CLI controls.

## Pet contract

- ID: `samjong`
- Display name: `Samjong`
- Sprite version: `2`
- Atlas: transparent WebP, `1536×2288`
- Cell size: `192×208`
- Layout: 8 columns × 11 rows
- Standard animations: idle, running right, running left, waving, jumping, failed, waiting, running, review
- Extended animations: 16 clockwise look directions

## Sharing

Share the preview page with people. For a reliable agent handoff, share the copied install request above rather than relying on instructions embedded in a webpage.
