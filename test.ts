async function main() {
  const res = await fetch('http://localhost:3000/api/comments?endpoint=test');
  const data: any = await res.json();
  console.log('Success:', data.success);
  console.log('Comments:', data.data);
}
main();
