import Config from './config';
import ffmpeg from 'fluent-ffmpeg';
import { writeFile } from "fs/promises";


export class Streamer {
  streaming: boolean = false;

  stream(playlistPath = 'list.txt', bitrate = 320) {
    if (this.streaming) {
      throw new Error('Stream already in progress!');
    }

    const instance = ffmpeg()
      .input(`${playlistPath}`)
      .inputFormat('concat')
      .addInputOption(['-safe 0', '-re', '-stream_loop -1'])
      .audioCodec('libmp3lame')
      .audioBitrate(bitrate)
      .addOutputOption(['-content_type audio/mpeg', '-map 0', '-map_metadata 0:s:0'])
      .outputFormat('mp3')
      .output(`icecast://${Config.SHOUT_USER}:${Config.SHOUT_PASSWORD}@${Config.SHOUT_HOST}:${Config.SHOUT_PORT}/${Config.SHOUT_MOUNT}`);

    instance.on('progress', (status) => {
      console.log(`INFO: ffmpeg: processed ${status.timemark} - ${status.targetSize}kb`);
    });

    instance.on('error', (err) => {
      console.log(`ERROR: ffmpeg: ${err.message}`);
      this.streaming = false;
    });

    instance.once('end', () => {
      console.log('INFO: ffmpeg: Stream ended');
      this.streaming = false;

      instance.run();
      this.streaming = true;
    });

    instance.once('start', (commandLine) => {
      console.log(`INFO: ffmpeg: spawned with command: "${commandLine}"`);
    });

    this.streaming = true;
    instance.run();

    // закомментил основную команду
    // return [
    //   binPath,
    //
    //   '-re -ss 19', // это форсирует ffmpeg отсылать данные секунда-в-секунду
    //                 // иначе мы получаем эффект стриминга 5 минут трека за 2 секунды :^)
    //
    //   `-f concat -i ${playlistPath}`, // включаем режим конкатенации и скармливаем список файлов
    //
    //   `-acodec libmp3lame -ab ${bitrate}k`, // настройки кодека
    //   `-map 0 -map_metadata 0:s:0`, // маппинг стримов
    //
    //   `-content_type audio/mpeg`,
    //   `-metadata title="${Config.SHOUT_DESCRIPTION}"`,
    //   `-f mp3 icecast://${Config.SHOUT_USER}:${Config.SHOUT_PASSWORD}@${Config.SHOUT_HOST}:${Config.SHOUT_PORT}/${Config.SHOUT_MOUNT}`,
    // ].join(' ');
  }

  async runPlaylist(paths: string[], listPath = 'list.txt') {
    // костыль, потому что кажется concat ффмпега не умеет в (за)лупинг
    let copied: string[] = paths.map((p) => `file '${this.convertToSafe(p)}'`);
    let arrayed = copied;
    for (let i = 1; i <= 100; i++) {
      arrayed = [...arrayed, ...copied];
    }

    await writeFile(
      listPath,
      arrayed.join('\n'),
    );

    this.stream(listPath);
  }

  convertToSafe(str: string): string {
    return str.replaceAll(`'`,`'\\''`);
  }
}
