import sharp from 'sharp';

describe('Sharp production runtime', () => {
  it('loads the CommonJS package as a callable image processor', async () => {
    const image = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 3,
        background: '#d85c42',
      },
    })
      .webp()
      .toBuffer();

    await expect(sharp(image).metadata()).resolves.toMatchObject({
      format: 'webp',
      width: 32,
      height: 32,
    });
  });
});
