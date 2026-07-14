import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("content");
const BOOK = "source-book-f1-illustrated-engineering";

// id (file id) -> { summaryZh, summaryEn, heading, prose }
const champions = {
  "person-nino-farina": {
    summaryZh: `意大利车手，F1 史上第一位世界冠军。1950 年首届世锦赛，他驾驶阿尔法·罗密欧 158 夺得首座车手世界冠军。`,
    summaryEn: `Italian driver and F1's first world champion, taking the inaugural 1950 title in an Alfa Romeo 158.`,
    heading: `首位世界冠军`,
    prose: `朱塞佩·「尼诺」·法里纳把名字永远刻在了 F1 的第一页。1950 年 5 月银石，他赢得了 F1 世界锦标赛历史上的第一场比赛，并在那年凭借阿尔法·罗密欧 158 夺得首届车手世界冠军——队友法焦利与方吉奥都排在他身后。\n\n法里纳出身都灵富商家庭，绰号「绅士车手」，风格却以大胆凶狠著称。战前他就在大奖赛中崭露头角，战后则成为阿尔法·罗密欧的主力。他在 1950 年的首冠让他成为 F1 史上第一位世界冠军，这一身份独一无二。此后他的生涯被方吉奥的光芒盖过，但「第一」的位置无人能取代。`,
  },
  "person-alberto-ascari": {
    summaryZh: `意大利车手，1952、1953 年两届世界冠军。他是法拉利 500 时代无可撼动的统治者，也是 F1 史上第一位成功卫冕的车手。`,
    summaryEn: `Italian driver, 1952 and 1953 world champion. The unchallenged master of the Ferrari 500 era and the first driver to defend an F1 title.`,
    heading: `第一个卫冕冠军`,
    prose: `阿尔贝托·阿斯卡利是 1950 年代初最稳定、最快的车手。1952、1953 年 F1 改用二级方程式规则凑数，他驾驶轻盈的法拉利 500 连续两年横扫冠军，胜率惊人，成为 F1 史上第一位成功卫冕的车手。\n\n阿斯卡利以精准、冷静的驾驶风格著称，人称「谨慎的飞人」。1955 年他在蒙扎测试法拉利运动赛车时意外身亡，年仅 36 岁。他的两冠与方吉奥的五冠共同定义了 F1 的头五年，而他对法拉利的忠诚也让他成为马拉内罗最早的英雄。`,
  },
  "person-jack-brabham": {
    summaryZh: `澳大利亚车手，1959、1960、1966 年三届世界冠军。他不仅驾驶自己参与设计的布拉汉姆赛车夺冠，还以车手—老板双重身份推动了后置引擎革命。`,
    summaryEn: `Australian driver, three-time champion (1959, 1960, 1966). He won in a car bearing his own name and, as driver-owner, drove the rear-engined revolution.`,
    heading: `开自队赛车夺冠`,
    prose: `杰克·布拉汉姆是 F1 史上唯一一位驾驶自姓赛车夺冠的车手。1959、1960 年他驾驶库珀的后置引擎赛车连夺两冠，把「发动机在后」的布局推广到整个围场。此后他与设计师罗恩·陶拉纳克另立布拉汉姆车队。\n\n1966 年，他驾驶自家车队、搭载瑞普科 V8 的 BT19 夺得第三座世界冠军——以车手兼老板的身份站上顶峰，这一成就至今无人复刻。布拉汉姆以实干、机械直觉与惊人耐力著称，他代表了那个车手要亲手调车的工匠年代。`,
  },
  "person-graham-hill": {
    summaryZh: `英国车手，1962、1968 年两届世界冠军。他是 F1 史上罕见的「三冠王」——同时拥有 F1 世界冠军、印第 500 与勒芒 24 小时桂冠。`,
    summaryEn: `British driver, two-time champion (1962, 1968) and a rare Triple Crown holder, with the F1 title, the Indy 500 and the 24 Hours of Le Mans.`,
    heading: `「三冠王」绅士`,
    prose: `格拉汉姆·希尔是赛车史上最全面的「全才」之一。他出身晚——26 岁才正式参赛——却先后在 BRM 与莲花拿下 1962、1968 两届 F1 世界冠军，并赢得印第安纳波利斯 500 与勒芒 24 小时，集齐被称颂的「三冠王」。\n\n希尔的标志性胡须与温文举止让他得到「绅士希尔」的绰号，赛道上却以坚韧著称，1960 年代末莲花挣扎期他仍能稳定得分。他是 1996 年冠军达蒙·希尔的父亲，父子两代世界冠军在 F1 史上极其罕见。1975 年他在一次飞机事故中离世。`,
  },
  "person-john-surtees": {
    summaryZh: `英国车手，1964 年世界冠军。他是唯一一位先后夺得摩托车与 F1 双料世界冠军的人——两轮与四轮的巅峰都被他踩在脚下。`,
    summaryEn: `British driver, 1964 world champion and the only person to win world championships on both motorcycles and in Formula 1.`,
    heading: `从两轮到四轮`,
    prose: `约翰·苏尔特斯是赛车运动史上独一无二的「双料之王」。他在 1950—1960 年代先统治了摩托车大奖赛，拿下七座 500cc 世界冠军，随后转投四轮赛车，1960 年加入法拉利。\n\n1964 年，他驾驶法拉利 158 夺得 F1 车手世界冠军，成为迄今唯一一位在两轮与四轮都登顶的车手。苏尔特斯的驾驶以硬朗、技术全面著称，后来还自组车队参赛。他那段横跨两个世界的传奇，至今无人能续写。`,
  },
  "person-denny-hulme": {
    summaryZh: `新西兰车手，1967 年世界冠军。这位低调的布拉汉姆车手以稳重与耐磨著称，是 1960 年代末最可靠的速度来源之一。`,
    summaryEn: `New Zealand driver, 1967 world champion. The unassuming Brabham pilot was known for consistency and endurance, among the most reliable of the late 1960s.`,
    heading: `低调的「熊」`,
    prose: `丹尼·赫尔姆外号「熊」，源于他粗犷的相貌与倔强的性格，赛道风格却以沉稳著称。他 1960 年代从新西兰来到欧洲，加入布拉汉姆，1967 年击败队友兼老板杰克·布拉汉姆夺得世界冠军。\n\n赫尔姆不追求排位赛的惊鸿一瞥，而以正赛长距离的稳定得分见长。1970 年代他转投迈凯伦继续争胜，同时在加拿大-美国挑战杯耐力赛中也很成功。他代表了那个年代「成绩比名气重要」的务实车手典范。`,
  },
  "person-jochen-rindt": {
    summaryZh: `奥地利车手，1970 年（追授）世界冠军。他在蒙扎练习赛事故身亡时已锁定冠军优势，成为 F1 史上唯一一位追授的世界冠军。`,
    summaryEn: `Austrian driver, posthumous 1970 world champion. He had a title-clinching lead when killed in practice at Monza, F1's only posthumous champion.`,
    heading: `追授的世界冠军`,
    prose: `约亨·林特是 F1 史上最令人扼腕的悲剧英雄。1970 年他驾驶莲花的 72D 赛车在赛季前半段连胜，建立起难以撼动的冠军优势。然而 9 月蒙扎练习赛，他的赛车在逼近帕拉波利卡弯时失控撞毁，林特当场身亡。\n\n此时赛季尚未结束，但他的积分优势已无人能追，最终被追授为 1970 年车手世界冠军——F1 史上唯一一位追授的冠军。林特以激进、勇敢的驾驶著称，速度惊人却常被可靠性拖累，1970 年那个统治级的开局，证明了他的天赋本可换来更多桂冠。`,
  },
  "person-emerson-fittipaldi": {
    summaryZh: `巴西车手，1972、1974 年两届世界冠军。他是 F1 史上最年轻的世界冠军纪录保持者之一，并开启了巴西车手的黄金年代。`,
    summaryEn: `Brazilian driver, two-time champion (1972, 1974). One of F1's youngest champions, he opened the golden age of Brazilian drivers.`,
    heading: `巴西黄金年代的开拓者`,
    prose: `埃默森·菲蒂帕尔迪是第一位震动 F1 的巴西车手。1972 年他在莲花夺得首冠，刷新了最年轻世界冠军纪录，1974 年转投迈凯伦再夺一冠。\n\n他的成功为后来的皮奎特与塞纳铺平了道路，让巴西成为 F1 的人才重镇。1970 年代末他自组科帕苏卡车队（以兄弟命名）参赛，虽未复制厂商车队的成功，却展现了巴西车手的雄心。退役后他在美国印地赛车再夺印第 500，证明其全能。`,
  },
  "person-jody-scheckter": {
    summaryZh: `南非车手，1979 年世界冠军。他为法拉利夺得 312T4 时代的最后一冠，也是迄今为止最后一位为法拉利加冕的南非车手。`,
    summaryEn: `South African driver, 1979 world champion. He took Ferrari's last title of the 312T4 era and is the last South African to crown a Ferrari campaign.`,
    heading: `法拉利的平稳冠军`,
    prose: `乔迪·谢克特以稳健的得分能力著称。他早年作风激进，曾在银石引发连环事故，但加入沃尔特·沃尔夫与法拉利后逐渐成熟为一名稳定的争冠车手。\n\n1979 年，他驾驶法拉利 312T4 全年稳定登台，击败队友吉尔斯·维伦纽瓦夺得世界冠军——这是法拉利在 1980 年代涡轮引擎到来前的最后一座车手冠军。谢克特的冠军证明：在天赋之外，减少失误的稳定同样是夺冠之道。`,
  },
  "person-alan-jones": {
    summaryZh: `澳大利亚车手，1980 年世界冠军。他是威廉姆斯车队的首任世界冠军，驾驶 FW07B 为这支独立车队开启争冠时代。`,
    summaryEn: `Australian driver, 1980 world champion and Williams' first title winner, driving the FW07B to open the independent team's title era.`,
    heading: `威廉姆斯的拓荒冠军`,
    prose: `阿兰·琼斯是威廉姆斯崛起的旗手。1980 年，他驾驶威廉姆斯 FW07B 全年稳定争胜，夺得车手世界冠军，也为这支由弗兰克·威廉姆斯白手起家的独立车队拿下首座制造商冠军。\n\n琼斯风格硬朗、敢拼，1970 年代末 shadow 与苏蒂斯辗转后，在威廉姆斯找到归宿。他的夺冠证明了独立车队能与厂商豪门抗衡，为威廉姆斯整个 1980—1990 年代的辉煌奠基。`,
  },
  "person-keke-rosberg": {
    summaryZh: `芬兰车手，1982 年世界冠军。他仅凭一场胜利夺冠，是 F1 史上胜场最少的冠军之一；这位「飞行的芬兰人」开启了芬兰车手的 F1 传统。`,
    summaryEn: `Finnish driver, 1982 world champion. He took the title with just one win, among the fewest ever, and as the 'Flying Finn' began Finland's F1 tradition.`,
    heading: `一场胜利的冠军`,
    prose: `科科·罗斯伯格是 F1 史上最传奇的「低胜场冠军」之一。1982 赛季极为混乱，多位车手轮流领跑、事故频发，罗斯伯格全年仅拿下一场胜利，却凭借惊人的稳定登台次数夺得世界冠军——这是 F1 史上单赛季胜场最少的冠军之一。\n\n这位外号「飞行的芬兰人」的车手是第一位扬名 F1 的芬兰人，为后来的哈基宁、莱科宁铺平了道路。他的儿子尼科·罗斯伯格后来也为威廉姆斯—梅赛德斯夺得 2016 年冠军，父子两代世界冠军在 F1 极其罕见。`,
  },
  "person-nigel-mansell": {
    summaryZh: `英国车手，1992 年世界冠军。他驾驶威廉姆斯 FW14B 以压倒性优势夺冠，被称为「狮子」；其激进敢拼的风格赢得无数车迷。`,
    summaryEn: `British driver, 1992 world champion. He dominated in the Williams FW14B; nicknamed 'Il Leone', his aggressive style won legions of fans.`,
    heading: `「狮子」的压倒性一季`,
    prose: `尼杰尔·曼塞尔以敢拼、绝不放弃的风格成为英国最受爱戴的车手之一。他在威廉姆斯与法拉利都与冠军擦肩——1986 年爆胎、1991 年被皮奎特压制——直到 1992 年，他驾驶搭载主动悬挂的威廉姆斯 FW14B 以赛季首站到第五站连胜的压倒性表现夺得世界冠军。\n\n曼塞尔外号「狮子」，源于意大利车迷对他在法拉利时期拼搏精神的赞誉。他的驾驶风格激进，常把赛车开到极限甚至爆缸，但也正因这种「孤注一掷」的气质，让他成为那个年代最具观赏性的车手。`,
  },
  "person-ayrton-senna": {
    summaryZh: `巴西车手，1988、1990、1991 年三届世界冠军。他被无数人视为史上最伟大的车手，以雨战天赋与单圈速度著称；1994 年圣马力诺大奖赛事故身亡。`,
    summaryEn: `Brazilian driver, three-time champion (1988, 1990, 1991). Regarded by many as the greatest, famed for wet-weather genius and one-lap pace; killed at the 1994 San Marino GP.`,
    heading: `雨战中的天才`,
    prose: `艾尔顿·塞纳被无数行家视为 F1 史上最伟大的车手。1988 年他与普罗斯特同队驾驶迈凯伦 MP4/4，首夺世界冠军，此后 1990、1991 年再夺两冠。他的单圈速度与雨战天赋近乎神迹——1993 年多宁顿的大雨中，他一圈连超四车的镜头被奉为经典。\n\n塞纳与普罗斯特的宿敌之争是 F1 史上最激烈的对抗，1989—1990 年铃鹿的两次碰撞把竞争推向了几乎失控的边缘。他对赛车极限与精神力量的追求近乎宗教般虔诚。1994 年 5 月 1 日，伊莫拉的坦布雷罗弯，他的威廉姆斯撞墙身亡，震惊世界。塞纳留下的不仅是三座冠军，更是「为速度而生」的纯粹传奇。`,
  },
  "person-damon-hill": {
    summaryZh: `英国车手，1996 年世界冠军。他是格拉汉姆·希尔之子，父子两代世界冠军在 F1 史上极为罕见；他驾驶威廉姆斯 FW18 夺冠。`,
    summaryEn: `British driver, 1996 world champion. Son of Graham Hill, forming one of F1's rare father-son champion dynasties; he won in the Williams FW18.`,
    heading: `继承父名的冠军`,
    prose: `达蒙·希尔是 F1 史上罕见的「将门之子」世界冠军。他的父亲格拉汉姆·希尔是两届世界冠军，但达蒙直到 30 多岁才进入 F1，起步明显晚于同侪。\n\n在威廉姆斯，他先是作为塞纳 1994 年的队友，塞纳遇难后扛起大旗，1994、1995 年都与冠军擦肩。1996 年他驾驶 FW18 全年稳定争胜，终于夺得世界冠军，与父亲成为 F1 史上第二对父子双冠军。希尔的职业生涯证明了坚持的价值——即便大器晚成，也能登上顶峰。`,
  },
  "person-jacques-villeneuve": {
    summaryZh: `加拿大车手，1997 年世界冠军。他是吉尔斯·维伦纽瓦之子，驾驶威廉姆斯 FW19 夺冠，是 1990 年代最具个性的车手之一。`,
    summaryEn: `Canadian driver, 1997 world champion. Son of Gilles Villeneuve, he won in the Williams FW19 and was among the 1990s' most distinctive characters.`,
    heading: `名将之后的突击`,
    prose: `雅克·维伦纽瓦继承了父亲吉尔斯·维伦纽瓦的姓氏与胆识。1996 年他在威廉姆斯首秀赛季就以微弱差距屈居亚军，1997 年驾驶 FW19 全年与舒马赫缠斗，在收官战赫雷斯戏剧性地撞掉舒马赫后夺冠。\n\n维伦纽瓦以独特的驾驶风格、标志性的黄绿赛车服与直率个性著称。夺冠后他在威廉姆斯与 BAR 车队辗转，再未接近冠军，但 1997 年那场与舒马赫的争冠对决，已成为 F1 经典。他是迄今最后一位为加拿大夺得 F1 世界冠军的车手。`,
  },
  "person-mika-hakkinen": {
    summaryZh: `芬兰车手，1998、1999 年两届世界冠军。他在迈凯伦终结了舒马赫与维伦纽瓦之后的混战，以「飞行的芬兰人」之名成为 1990 年代末的统治者。`,
    summaryEn: `Finnish driver, two-time champion (1998, 1999). At McLaren he ended the post-1997 free-for-all; the 'Flying Finn' ruled the late 1990s.`,
    heading: `「飞行的芬兰人」`,
    prose: `米卡·哈基宁是 1990 年代末 F1 的绝对主角。他在迈凯伦的职业生涯几经波折——1995 年澳大利亚练习赛几乎因事故丧命——却奇迹般康复，并在 1998 年驾驶 MP4-13 一举夺得世界冠军，结束了多年的冠军混战。\n\n1999 年他与舒马赫展开经典对决，舒马赫因腿伤缺阵期间他稳住优势卫冕成功。哈基宁以极快的单圈速度与冷静著称，与舒马赫的缠斗被视作那个年代最精彩的对决。2001 年他渐趋退役，把迈凯伦交给了更年轻的莱科宁。`,
  },
  "person-kimi-r-ikk-nen": {
    summaryZh: `芬兰车手，2007 年世界冠军。这位「冰人」以寡言与天赋著称，在法拉利首季即夺冠，是 21 世纪最受车迷喜爱的车手之一。`,
    summaryEn: `Finnish driver, 2007 world champion. The 'Iceman', famed for his silence and raw talent, won the title in his first Ferrari year; a 21st-century fan favourite.`,
    heading: `「冰人」的天赋`,
    prose: `基米·莱科宁被车迷亲切地称为「冰人」。他寡言少语，赛道上却以冰冷精准的天赋著称——2007 年加盟法拉利首赛季，便在收官战巴西从落后 7 分反超汉密尔顿与阿隆索夺得世界冠军，成为 F1 史上最具戏剧性的逆转之一。\n\n莱科宁的职业生涯横跨两个时代：先在迈凯伦成名，2007 年为法拉利夺冠，2009 年短暂离开 F1 去拉力赛，2012 年回归路特斯，2014—2018 年重返法拉利，最后在阿尔法·罗梅罗退役。他以「别管我，我知道自己在做什么」的态度与极致的快圈速度，成为现代 F1 最具个性的存在。他的 349 场首发纪录长期保持历史第一。`,
  },
  "person-jenson-button": {
    summaryZh: `英国车手，2009 年世界冠军。他在布朗 GP 的「双扩散器」赛车上一鸣惊人夺冠，是 F1 史上最具戏剧性的「灰姑娘」冠军之一。`,
    summaryEn: `British driver, 2009 world champion. He stunned the field in Brawn GP's double-diffuser car, one of F1's great Cinderella titles.`,
    heading: `布朗 GP 的灰姑娘`,
    prose: `简森·巴顿的 2009 赛季是 F1 史上最动人的「灰姑娘」故事。本田于 2008 年底退出 F1，罗斯·布朗临危接手车队，用一套被对手质疑的「双扩散器」解读打造出 BGP 001。巴顿在前七站拿下六胜，建立起无法撼动的优势，最终夺得世界冠军。\n\n巴顿以顺滑的驾驶风格与精明的策略头脑著称，2010 年转投迈凯伦后仍多次争胜。他的夺冠证明了：一支濒临解散的车队，只要抓住规则解读的先机，就能颠覆豪门格局。巴顿职业生涯绵长而稳定，是英国最受欢迎的车手之一。`,
  },
  "person-nico-rosberg": {
    summaryZh: `德国车手，2016 年世界冠军。他在梅赛德斯与汉密尔顿的内部之争中胜出后随即退役，父亲科科·罗斯伯格也是世界冠军。`,
    summaryEn: `German driver, 2016 world champion. He beat teammate Hamilton in Mercedes' intra-team war then retired immediately; his father Keke was also champion.`,
    heading: `击败汉密尔顿后退役`,
    prose: `尼科·罗斯伯格的冠军之路是一场长达数年的内部消耗战。作为 1982 年冠军科科·罗斯伯格之子，他 2010 年起效力梅赛德斯，2013 年汉密尔顿到来后，两人「教授之子」对「天才」的较量贯穿整个混动王朝。\n\n2014、2015 年他都屈居汉密尔顿之后，2016 年他以惊人的稳定性、更少的退赛与关键分站的发力，终于在阿布扎比收官战拿到足以加冕的名次，击败汉密尔顿夺得首冠。随后他立即宣布退役——在最巅峰时转身离开。罗斯伯格证明了：面对史上最强的队友，靠的是坚持与不犯错。`,
  },
  "person-james-hunt": {
    summaryZh: `英国车手，1976 年世界冠军。他那一年与劳达的史诗对决被搬上银幕，放浪不羁的生活方式让他成为 1970 年代的偶像。`,
    summaryEn: `British driver, 1976 world champion. His epic duel that year with Lauda was made into a film; his bohemian life made him a 1970s icon.`,
    heading: `放浪的 1976 英雄`,
    prose: `詹姆斯·亨特是 1970 年代 F1 最具魅力的叛逆偶像。他长发、衬衫敞胸、随手抽烟，赛道上却快得惊人。1976 年他从迈凯伦起步，与法拉利的尼基·劳达展开了一场载入史册的冠军争夺。\n\n那一年的高潮在纽伯格林：劳达惨烈车祸几乎丧命，六周后却缠着绷带复出；亨特则在雨中的日本大奖赛拿到足以夺冠的名次，以一分之差压倒劳达。这场「放浪浪子」对「理性机器」的对决后来被拍成电影《极速风流》。亨特 1979 年早早退役，转为评论员，1993 年心脏病发离世。他用不羁的一生证明，冠军也可以活得很潇洒。`,
  },
  "person-mario-andretti": {
    summaryZh: `美国车手，1978 年世界冠军。他驾驶莲花 79 地面效应赛车夺冠，是迄今最后一位为美国夺得 F1 世界冠军的车手。`,
    summaryEn: `American driver, 1978 world champion. He won in the ground-effect Lotus 79 and is the last American to take the F1 title.`,
    heading: `最后的美国冠军`,
    prose: `马里奥·安德烈蒂是赛车史上最多才的美国车手。他出生于意大利，战后移民美国，几乎赢遍了所有顶级赛事：印第 500、代托纳 500、勒芒，以及 F1 世界冠军。\n\n1978 年，他驾驶科林·查普曼的莲花 79——第一辆把地面效应发挥到极致的赛车——以压倒性优势夺得 F1 车手世界冠军，成为迄今最后一位为美国加冕的 F1 车手。安德烈蒂以全面、适应力强著称，从泥地椭圆到 F1 街道赛都能争胜。他的家族后来多人投身赛车，是北美赛车界最响亮的姓氏。`,
  },
  "person-jody-scheckter-dup": null,
  "person-mike-hawthorn": {
    summaryZh: `英国车手，1958 年世界冠军。他是 F1 史上第一位英国世界冠军，以温文举止与领结造型著称；夺冠后随即退役，翌年因车祸离世。`,
    summaryEn: `British driver, 1958 world champion and F1's first British title-holder, known for his bow-tie elegance; he retired immediately and died in a road crash the next year.`,
    heading: `戴领结的冠军`,
    prose: `麦克·霍索恩把英国带上了 F1 世界冠军榜的顶端。1958 年，他驾驶法拉利 Dino 246 以一分之差压倒斯特林·莫斯夺得世界冠军，成为 F1 史上第一位英国世界冠军。\n\n霍索恩以温文尔雅的「绅士」形象著称，常戴领结出赛，风格却极其凶猛。1955 年勒芒惨案中他卷入的那场事故，至今仍是赛车史最黑暗的一页。1958 年夺冠后他随即宣布退役，不幸在翌年因公路车祸离世，年仅 29 岁。他的冠军为之后英国车手统治 F1 数十年开了先河。`,
  },
  "person-phil-hill": {
    summaryZh: `美国车手，1961 年世界冠军。他是首位夺得 F1 世界冠军的美国人，驾驶法拉利 156「鲨鱼鼻」夺冠，也是耐力赛的名将。`,
    summaryEn: `American driver, 1961 world champion. The first American F1 title-holder, he won in the Ferrari 156 'sharknose' and was also a sports-car great.`,
    heading: `首位美国冠军`,
    prose: `菲尔·希尔是第一位、也是迄今为数不多夺得 F1 世界冠军的美国人。他在法拉利效力多年，既跑大奖赛也跑耐力赛，1961 年驾驶法拉利 156「鲨鱼鼻」与队友特里普斯争夺冠军——悲剧的是特里普斯在蒙扎事故身亡，希尔带着沉重心情拿下了那座冠军。\n\n希尔的驾驶以精密、细腻著称，对机械的深刻理解让他尤其擅长长距离与耐力赛，多次赢得勒芒与赛百耐 12 小时。他的夺冠让美国在 F1 早期就留下了名字，此后仅有马里奥·安德烈蒂为美国再添一冠。`,
  },
  "person-lando-norris": {
    summaryZh: `英国车手，2025 年世界冠军。他在迈凯伦逐渐成长，2025 年终于为这支老牌车队带回车手世界冠军，是新生代的代表人物。`,
    summaryEn: `British driver, 2025 world champion. He grew at McLaren and finally brought the famous team a drivers' title in 2025, a face of the new generation.`,
    heading: `迈凯伦复兴的旗手`,
    prose: `兰多·诺里斯是 F1 新生代最受欢迎的面孔之一。他 2019 年加盟迈凯伦，从一名爱玩电竞的少年逐渐成长为争冠车手。随着迈凯伦在地面效应规则下重回收争冠行列，诺里斯的速度与稳定性逐年提升。\n\n2025 年，他驾驶迈凯伦赛车击败维斯塔潘的红牛王朝，为迈凯伦带回久违的车手世界冠军，自己也跻身世界冠军之列。诺里斯以雨战细腻、与车队的默契配合和阳光性格著称，他的登顶标志着 F1 从维斯塔潘独大进入群雄并起的新格局。`,
  },
};

async function enrich(id, spec) {
  if (!spec) return;
  const file = path.join(ROOT, "people", `${id}.json`);
  const doc = JSON.parse(await readFile(file, "utf8"));
  doc.summary = { zh: spec.summaryZh, en: spec.summaryEn };
  if (!doc.sourceIds.includes(BOOK)) doc.sourceIds.push(BOOK);
  doc.blocks = [
    {
      id: `${doc.id.replace(/^person-/, "")}-bio`,
      type: "richText",
      heading: { zh: spec.heading },
      sourceIds: [BOOK],
      content: { zh: spec.prose },
    },
  ];
  doc.updatedAt = "2026-07-14T12:00:00.000Z";
  await writeFile(file, JSON.stringify(doc, null, 2) + "\n", "utf8");
  console.log(`enriched ${id}`);
}

let count = 0;
for (const [id, spec] of Object.entries(champions)) {
  await enrich(id, spec);
  if (spec) count++;
}

// Register in book source.
const srcFile = path.join(ROOT, "sources", `${BOOK}.json`);
const src = JSON.parse(await readFile(srcFile, "utf8"));
const existing = new Set(src.supportedClaims.map((c) => c.entityId));
let added = 0;
for (const [id, spec] of Object.entries(champions)) {
  if (spec && !existing.has(id)) {
    src.supportedClaims.push({
      entityId: id,
      field: "summary",
      notes: "第1章",
    });
    added++;
  }
}
await writeFile(srcFile, JSON.stringify(src, null, 2) + "\n", "utf8");
console.log(`Enriched ${count} champion drivers; book source +${added}.`);
