# General advice

- Ask questions if a prompt is unclear before you try to figure out what the prompt might mean on your own

# Implementation advice

- Always write UI texts to the i18n/ files. 
- Avoid magic numbers. If you need to use a literal with the same meaning on more than one place, use an exported, well-named constant for it. 
- If you implement a collapsable section, make sure its state is persisted to stay open on re-rendering