import json

labels=[]

with open("imagenet_classes.txt","r") as f:
    for line in f:
        labels.append(line.strip())

with open("imagenet_classes.json", "w") as f:
    json.dump(labels,f,indent=2)

print(f"Converted {len(labels)} labels to JSON")
