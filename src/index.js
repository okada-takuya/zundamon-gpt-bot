require("dotenv").config();

// 環境変数の取込み
const { DISCORD_BOT_TOKEN, OPENAI_API_KEY } = process.env;

const {
  ApplicationCommandOptionType,
  Client,
  Events,
  GatewayIntentBits,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// 一貫したchatモデルの性格付けのため、system roleで性格・前提条件を設定
// 英語の方が高い精度で解釈してくれる。
// 参考：https://zenn.dev/zuma_lab/articles/chatgpt-line-chatbot#gpt-3.5-turbo-api-%E3%81%AE-role-%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6
SYSTEM_PROMPT = [
  {
    role: "system",
    content:
      "あなたは'ずんだもん'という名前の女の子です。" +
      "ずんだもんとは、東北ずん子の武器である'ずんだアロー'に変身できる妖精です。" +
      "あなたの一人称は'ボク'です。" +
      "あなたは砕けた口調で話してください。" +
      "あなたの語尾は'のだ'、または、'なのだ'にしてください。",
  },
];

// Discord Chat Bot - イベントに対する動作定義
// - 起動確認ログ出力
client.once(Events.ClientReady, () => {
  console.log(`${client.user.tag} Ready`);
});

client.on(Events.ClientReady, async () => {
  //スラッシュコマンドの作成
  const chat_command = [
    {
      name: "zundamon", //コマンド名
      description: "質問したら答えが返ってきます", //コマンドの説明
      options: [
        //引数の作成
        {
          type: ApplicationCommandOptionType.String,
          name: "質問",
          description: "質問したい文を入れてください。",
          required: true,
        },
      ],
    },
  ];
  await client.application.commands.set(chat_command);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = interaction.commandName;

  if (command === "zundamon") {
    // 3秒以内のインタラクション処理制約を逃れるため、まず返信延期（考え中の表示）を行う
    interaction.deferReply();

    const question = interaction.options.getString("質問");
    console.log(question);

    const messages = SYSTEM_PROMPT.concat([
      { role: "user", content: `${question}` },
    ]);

    (async () => {
      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo", //言語モデル
        messages: messages,
        // messages: [{ role: "user", content: `${question}` }],
      });
      console.log(completion.data.choices[0].message.content); //コンソールに出力
      // deferReplyしたinteractionに対しては、編集の形で返事する
      await interaction.editReply(
        `${question}\n>>\n${completion.data.choices[0].message.content}\r\n`
      );
    })();
  }
});

// Discordへの接続
client.login(DISCORD_BOT_TOKEN);
