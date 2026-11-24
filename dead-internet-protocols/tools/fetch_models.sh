#!/usr/bin/env bash
# Fetch the speech models used for narration (Kokoro-82M, Apache-2.0) and for
# verification/subtitle timing (Whisper small, MIT) from the npm registry, reassemble
# the sharded weights and verify their checksums.
#   usage: tools/fetch_models.sh <models_dir>
set -euo pipefail
OUT="${1:-models}"
mkdir -p "$OUT/tmp" "$OUT/voices" "$OUT/whisper-small-ct2"
cd "$OUT/tmp"
reg="https://registry.npmjs.org"

echo "== Kokoro-82M fp32 ONNX (19 shards in 3 packages)"
for p in a b c; do
  curl -sSfL -o "fp32$p.tgz" "$reg/kokoro-fp32$p-shards/-/kokoro-fp32$p-shards-1.0.0.tgz"
  mkdir -p "x$p" && tar xzf "fp32$p.tgz" -C "x$p"
done
: > ../kokoro-fp32.onnx
for i in $(seq 0 18); do cat x*/package/kokoro-fp32.part$i.bin >> ../kokoro-fp32.onnx; done
echo "8fbea51ea711f2af382e88c833d9e288c6dc82ce5e98421ea61c058ce21a34cb  ../kokoro-fp32.onnx" | sha256sum -c -

echo "== Kokoro voice tensors (from kokoro-local-runtime, originally kokoro-js 1.2.1)"
curl -sSfL -o klr.tgz "$reg/kokoro-local-runtime/-/kokoro-local-runtime-0.1.0.tgz"
mkdir -p klr && tar xzf klr.tgz -C klr
cp klr/package/voices/*.bin ../voices/
echo "d583ccff3cdca2f7fae535cb998ac07e9fcb90f09737b9a41fa2734ec44a8f0b  ../voices/af_heart.bin" | sha256sum -c -

echo "== Whisper small (CTranslate2 int8, 4 parts)"
for i in 0 1 2 3; do
  curl -sSfL -o "w$i.tgz" "$reg/@skillninja/shortmovie-telop-model-p$i/-/shortmovie-telop-model-p$i-1.0.0.tgz"
  mkdir -p "w$i" && tar xzf "w$i.tgz" -C "w$i"
done
cat w0/package/model.bin.part0 w1/package/model.bin.part1 w2/package/model.bin.part2 w3/package/model.bin.part3 > ../whisper-small-ct2/model.bin
cp w0/package/{config.json,preprocessor_config.json,tokenizer.json,vocabulary.json} ../whisper-small-ct2/
echo "ca732cb1379efc49417d028465f543d83a39de2c61f3027678de103dc404ce73  ../whisper-small-ct2/model.bin" | sha256sum -c -

cd .. && rm -rf tmp
echo "== Packing voices.npz"
python3 - <<'EOF'
import glob, os, numpy as np
d = {os.path.basename(f)[:-4]: np.fromfile(f, dtype=np.float32).reshape(510, 1, 256) for f in sorted(glob.glob('voices/*.bin'))}
np.savez('voices.npz', **d)
print(len(d), 'voices packed')
EOF
echo "models ready in $(pwd)"
