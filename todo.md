# TODO

* Extend the grammar to allow components (characters, etc.) to be defined either within or outside of the 'story' structure, allowing the author to create components (characters, scenes,) in separate files (like C#) which are automatically consolidated during processing.  There is no need for an explicit 'include' or 'using' statement - the system parses all .actone files found in the project into a single AST that drives all views and processing functions.

* The problems list must span all files in the active project.  Clicking a line in the problems list must navigate to the corresponding line in the editor, opening the file if necessary.
