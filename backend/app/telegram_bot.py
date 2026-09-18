import logging
import os
import sys
from pathlib import Path

# Ensure backend root directory is in sys.path when running script directly
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    ApplicationBuilder,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from app.database.connection import SessionLocal
from app.services.translate_service import TranslateService

load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


# =============================================================================
# Helper: Get DB & Service
# =============================================================================

def get_service():
    db = SessionLocal()
    return db, TranslateService(db=db)


# =============================================================================
# Command Handlers
# =============================================================================

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_tg = update.effective_user
    db, service = get_service()
    try:
        user = service.get_or_create_user(
            username=user_tg.username or f"user_{user_tg.id}",
            telegram_id=str(user_tg.id),
        )
        context.user_data["db_user_id"] = user.id

        topics = service.get_topics()
        levels = service.get_levels()

        keyboard = []
        keyboard.append(
            [
                InlineKeyboardButton(
                    "📚 CHỌN CHỦ ĐỀ (TOPIC)", callback_data="header_topic"
                )
            ]
        )
        for t in topics:
            keyboard.append(
                [
                    InlineKeyboardButton(
                        f"• {t.name}", callback_data=f"topic_{t.id}"
                    )
                ]
            )

        keyboard.append(
            [
                InlineKeyboardButton(
                    "🎯 CHỌN TRÌNH ĐỘ (LEVEL)", callback_data="header_level"
                )
            ]
        )
        for l in levels:
            keyboard.append(
                [
                    InlineKeyboardButton(
                        f"• {l.name} ({l.description or ''})",
                        callback_data=f"level_{l.id}",
                    )
                ]
            )

        reply_markup = InlineKeyboardMarkup(keyboard)

        welcome_text = (
            f"👋 Xin chào *{user_tg.first_name}*!\n\n"
            "Chào mừng bạn đến với **English Learning Assistant** — Ứng dụng học tiếng Anh thông minh qua dịch thuật!\n\n"
            "📌 **Hướng dẫn:**\n"
            "1. Vui lòng chọn **Topic** và **Level** học bên dưới.\n"
            "2. Gõ lệnh `/study` để nhận bài tập dịch tiếng Việt sang tiếng Anh.\n"
            "3. Hệ thống sẽ chấm điểm, chỉ ra các lỗi sai và tự động khắc phục điểm yếu của bạn ở các câu tiếp theo!\n"
            "4. Gõ `/stats` để xem thống kê tiến trình học tập."
        )

        await update.message.reply_text(
            welcome_text,
            reply_markup=reply_markup,
            parse_mode="Markdown",
        )
    finally:
        db.close()


async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    data = query.data
    db, service = get_service()
    try:
        if data.startswith("topic_"):
            topic_id = data.replace("topic_", "")
            context.user_data["topic_id"] = topic_id
            topics = service.get_topics()
            topic_name = next(
                (t.name for t in topics if t.id == topic_id), "Đã chọn"
            )
            await query.message.reply_text(
                f"✅ Bạn đã chọn Chủ đề: *{topic_name}*\n"
                "Tiếp tục chọn Trình độ hoặc gõ `/study` để bắt đầu học!",
                parse_mode="Markdown",
            )
        elif data.startswith("level_"):
            level_id = data.replace("level_", "")
            context.user_data["level_id"] = level_id
            levels = service.get_levels()
            level_name = next(
                (l.name for l in levels if l.id == level_id), "Đã chọn"
            )
            await query.message.reply_text(
                f"✅ Bạn đã chọn Trình độ: *{level_name}*\n"
                "Gõ `/study` để nhận câu bài tập đầu tiên!",
                parse_mode="Markdown",
            )
    finally:
        db.close()


async def study_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_tg = update.effective_user
    db, service = get_service()
    try:
        user = service.get_or_create_user(
            username=user_tg.username or f"user_{user_tg.id}",
            telegram_id=str(user_tg.id),
        )
        user_id = user.id

        topic_id = context.user_data.get("topic_id")
        level_id = context.user_data.get("level_id")

        if not topic_id or not level_id:
            topics = service.get_topics()
            levels = service.get_levels()
            if not topic_id and topics:
                topic_id = topics[0].id
                context.user_data["topic_id"] = topic_id
            if not level_id and levels:
                level_id = levels[0].id
                context.user_data["level_id"] = level_id

        await update.message.reply_text(
            "⏳ Đang tạo bài tập cá nhân hóa cho bạn..."
        )

        sentence = service.create_exercise(
            user_id=user_id,
            topic_id=topic_id,
            level_id=level_id,
        )

        context.user_data["current_sentence_id"] = sentence.id

        msg = (
            "🇻🇳 **BÀI TẬP DỊCH TIẾNG ANH**\n\n"
            f"*{sentence.vietnamese_text}*\n\n"
            "👉 Hãy trả lời bằng câu dịch tiếng Anh của bạn bên dưới:"
        )

        await update.message.reply_text(msg, parse_mode="Markdown")
    finally:
        db.close()


async def text_message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    current_sentence_id = context.user_data.get("current_sentence_id")
    if not current_sentence_id:
        await update.message.reply_text(
            "Vui lòng gõ `/study` để nhận bài tập trước khi trả lời!"
        )
        return

    user_tg = update.effective_user
    user_answer = update.message.text.strip()

    await update.message.reply_text(
        "🔎 Agent đang phân tích và chấm điểm bài làm của bạn..."
    )

    db, service = get_service()
    try:
        user = service.get_or_create_user(
            username=user_tg.username or f"user_{user_tg.id}",
            telegram_id=str(user_tg.id),
        )

        result = service.submit_translation(
            user_id=user.id,
            sentence_id=current_sentence_id,
            user_answer=user_answer,
        )

        context.user_data["current_sentence_id"] = None

        score = result.get("score", 0)
        feedback = result.get("feedback", "")
        corrected = result.get("corrected_answer", "")
        mistakes = result.get("mistakes", [])

        status_emoji = "🎉" if score >= 80 else "📝"
        reply = [
            f"{status_emoji} **KẾT QUẢ ĐÁNH GIÁ**",
            f"⭐ **Điểm số:** `{score}/100`",
            f"💡 **Nhận xét:** {feedback}",
            f"✨ **Đáp án gợi ý:** {corrected}",
        ]

        if mistakes:
            reply.append("\n⚠️ **CÁC LỖI CẦN LƯU Ý:**")
            for i, m in enumerate(mistakes, 1):
                reply.append(
                    f"{i}. *{m['mistake_type']} - {m['mistake_subtype']}*\n"
                    f"   ❌ Từ sai: `{m['wrong_text']}`\n"
                    f"   ✅ Sửa thành: `{m['correct_text']}`\n"
                    f"   💬 Giải thích: {m['explanation']}"
                )

        reply.append(
            "\n👉 Gõ `/study` để làm câu tiếp theo hoặc `/stats` để xem thống kê!"
        )

        await update.message.reply_text(
            "\n\n".join(reply), parse_mode="Markdown"
        )
    finally:
        db.close()


async def stats_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_tg = update.effective_user
    db, service = get_service()
    try:
        user = service.get_or_create_user(
            username=user_tg.username or f"user_{user_tg.id}",
            telegram_id=str(user_tg.id),
        )

        stats = service.get_user_progress(user_id=user.id)

        msg = (
            "📊 **THỐNG KÊ TIẾN TRÌNH HỌC TẬP**\n\n"
            f"👤 Người học: *{user_tg.first_name}*\n"
            f"📝 Tổng số bài tập đã làm: `{stats['total_attempts']}`\n"
            f"🎯 Số bài làm đúng: `{stats['correct_attempts']}`\n"
            f"📈 Tỉ lệ chính xác: `{stats['accuracy_rate']}%`\n"
            f"⭐ Điểm số trung bình: `{stats['average_score']}`\n"
        )

        if stats["top_weaknesses"]:
            msg += "\n⚠️ **TOP ĐIỂM YẾU CẦN CẢI THIỆN:**\n"
            for w in stats["top_weaknesses"]:
                msg += f"• *{w['subtype']}*: {w['count']} lần mắc lỗi\n"

        msg += "\n💪 AI Agent sẽ ưu tiên đưa các điểm yếu này vào bài tập tiếp theo để giúp bạn luyện tập!"

        await update.message.reply_text(msg, parse_mode="Markdown")
    finally:
        db.close()


async def reset_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    await update.message.reply_text(
        "🔄 **Đã đặt lại trạng thái học tập trên Telegram!**\n\n"
        "Gõ `/start` để chọn lại Topic & Level hoặc `/study` để tạo bài tập mới.",
        parse_mode="Markdown",
    )


# =============================================================================
# Run Bot Function
# =============================================================================

def run_telegram_bot():
    if not TELEGRAM_BOT_TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN is not set in .env file.")
        return

    print("Starting Telegram Bot listener...")
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("study", study_command))
    app.add_handler(CommandHandler("new", study_command))
    app.add_handler(CommandHandler("stats", stats_command))
    app.add_handler(CommandHandler("reset", reset_command))
    app.add_handler(CommandHandler("cancel", reset_command))
    app.add_handler(CallbackQueryHandler(callback_handler))
    app.add_handler(
        MessageHandler(filters.TEXT & (~filters.COMMAND), text_message_handler)
    )

    app.run_polling()


if __name__ == "__main__":
    run_telegram_bot()
