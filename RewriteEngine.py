import openai
import streamlit as st

import traceback
try:
    # OpenAI API key
    openai.api_key = "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"

    def text_style_transfer(model, text, style):
        completions = openai.Completion.create(
            engine=model,
            prompt=f"{style}:{text}",
            max_tokens=1024,
            n=1,
            stop=None,
            temperature=0.5,
        )

        message = completions.choices[0].text
        return message.strip()

    def write():
        # Text Input
        text = st.text_input("Enter text to transform:")

        # Writing Style Selection
        style = st.radio("Select a writing style:",
                         ["formal", "informal", "creative", "technical"])

        # Generate Button
        if st.button("Generate"):
            result = text_style_transfer(model="text-davinci-002", text=text, style=style)
            st.success(result)

    if __name__ == '__main__':
        write()

except Exception as e:
    st.write(traceback.print_exc())
