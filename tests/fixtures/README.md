# Media Fixture

`clip.mp4` is a generated 1-second, 32 x 32 H.264 color clip for the notification upload test. It contains no user data.

Regenerate with:

```sh
ffmpeg -f lavfi -i color=c=blue:s=32x32:d=1 -c:v libx264 -pix_fmt yuv420p -movflags +faststart tests/fixtures/clip.mp4
```
