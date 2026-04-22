# General advice

- If you do not find an information with low effort, ask the human first if they can point you to the right place before you excess a significant amount of work to find it yourself

# Implementation advice

- Always write UI texts to the i18n/ files. 
- Avoid magic numbers. If you need to use a literal with the same meaning on more than one place, use an exported, well-named constant for it. 
- If you implement a collapsable section, make sure its state is persisted to stay open on re-rendering