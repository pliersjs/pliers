# pliers basic command completion

_pliers_get_task_list () {
  pliers list | awk '/^\t[a-z]+/ { print $1 }'
}

_pliers () {
  if [ -f pliers.js ]; then
    compadd `_pliers_get_task_list`
  fi
}

compdef _pliers pliers
